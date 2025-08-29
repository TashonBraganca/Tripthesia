import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Input validation schema
const localInsightsSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  duration: z.number().min(1).max(30),
  interests: z.array(z.string()).optional(),
  travelDates: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  userProfile: z.object({
    age: z.number().optional(),
    travelExperience: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    culturalInterest: z.enum(['low', 'medium', 'high']).optional(),
    languageSpoken: z.array(z.string()).optional(),
  }).optional(),
  preferences: z.object({
    hiddenGems: z.boolean().optional(),
    localCulture: z.boolean().optional(),
    foodExperiences: z.boolean().optional(),
    festivals: z.boolean().optional(),
    nightlife: z.boolean().optional(),
    shopping: z.boolean().optional(),
    nature: z.boolean().optional(),
  }).optional(),
});

type LocalInsightsInput = z.infer<typeof localInsightsSchema>;

interface LocalInsightsResponse {
  destination: string;
  hiddenGems: HiddenGem[];
  localCulture: CulturalInsight[];
  foodExperiences: FoodExperience[];
  seasonalHighlights: SeasonalHighlight[];
  culturalEvents: CulturalEvent[];
  localTips: LocalTip[];
  transportInsights: TransportInsight[];
  safetyTips: SafetyTip[];
  weatherInsights: WeatherInsight[];
  budgetTips: BudgetTip[];
  languageGuide: LanguageGuide;
  etiquetteGuide: EtiquetteGuide[];
  emergency: EmergencyInfo;
  metadata: {
    generatedAt: string;
    season: string;
    confidence: number;
  };
}

interface HiddenGem {
  name: string;
  type: 'landmark' | 'restaurant' | 'viewpoint' | 'market' | 'beach' | 'trail' | 'museum' | 'bar';
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  bestTime: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'challenging';
  insiderTip: string;
  howToFind: string;
  whySpecial: string;
  localName?: string;
  estimatedTime: number; // minutes
}

interface CulturalInsight {
  category: 'tradition' | 'history' | 'art' | 'religion' | 'lifestyle';
  title: string;
  description: string;
  significance: string;
  experienceTips: string[];
  bestPlacesToExperience: string[];
  whatToExpect: string;
  respectfulBehavior: string[];
}

interface FoodExperience {
  type: 'street-food' | 'local-restaurant' | 'market' | 'cooking-class' | 'food-tour';
  name: string;
  description: string;
  mustTryDishes: string[];
  location: string;
  priceRange: string;
  localOrderingTips: string[];
  culturalContext: string;
  vegetarianOptions: string[];
  allergyInfo: string[];
}

interface SeasonalHighlight {
  season: string;
  months: string[];
  highlights: string[];
  weatherExpectation: string;
  clothingRecommendation: string[];
  specialEvents: string[];
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  budgetImpact: 'cheaper' | 'normal' | 'expensive';
}

interface CulturalEvent {
  name: string;
  type: 'festival' | 'celebration' | 'market' | 'performance' | 'ceremony';
  description: string;
  dateInfo: string;
  location: string;
  duration: string;
  cost: string;
  participationLevel: 'observer' | 'participant' | 'both';
  culturalSignificance: string;
  whatToBring: string[];
  etiquette: string[];
  bookingRequired: boolean;
  crowdLevel: 'low' | 'medium' | 'high';
}

interface LocalTip {
  category: 'money' | 'transport' | 'communication' | 'shopping' | 'general';
  tip: string;
  importance: 'high' | 'medium' | 'low';
  context: string;
}

interface TransportInsight {
  mode: string;
  description: string;
  cost: string;
  pros: string[];
  cons: string[];
  bookingTips: string[];
  localNames: string[];
  paymentMethods: string[];
}

interface SafetyTip {
  category: 'general' | 'transport' | 'money' | 'health' | 'communication';
  tip: string;
  severity: 'info' | 'caution' | 'warning';
  context: string;
}

interface WeatherInsight {
  season: string;
  temperature: string;
  rainfall: string;
  humidity: string;
  recommendations: string[];
  whatToPack: string[];
}

interface BudgetTip {
  category: string;
  tip: string;
  potentialSavings: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface LanguageGuide {
  primaryLanguage: string;
  commonPhrases: Array<{
    english: string;
    local: string;
    pronunciation: string;
    context: string;
  }>;
  languageBarriers: string[];
  communicationTips: string[];
}

interface EtiquetteGuide {
  situation: string;
  dos: string[];
  donts: string[];
  importance: 'critical' | 'important' | 'helpful';
}

interface EmergencyInfo {
  emergencyNumbers: Array<{
    service: string;
    number: string;
    notes: string;
  }>;
  hospitals: Array<{
    name: string;
    location: string;
    specialization?: string;
  }>;
  embassies: Array<{
    country: string;
    address: string;
    phone: string;
  }>;
  importantApps: Array<{
    name: string;
    purpose: string;
    downloadLink?: string;
  }>;
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createLocalInsightsPrompt(input: LocalInsightsInput): string {
  const season = getSeasonFromDates(input.travelDates?.start);
  const interests = input.interests?.length ? input.interests.join(', ') : 'general travel';
  
  return `As a local expert guide for ${input.destination}, provide comprehensive insider knowledge and cultural insights.

Travel Details:
- Destination: ${input.destination}
- Duration: ${input.duration} days
- Travel Season: ${season}
- Interests: ${interests}
${input.travelDates ? `- Travel Dates: ${input.travelDates.start} to ${input.travelDates.end}` : ''}

User Profile:
${input.userProfile?.travelExperience ? `- Experience Level: ${input.userProfile.travelExperience}` : ''}
${input.userProfile?.culturalInterest ? `- Cultural Interest: ${input.userProfile.culturalInterest}` : ''}
${input.userProfile?.languageSpoken?.length ? `- Languages: ${input.userProfile.languageSpoken.join(', ')}` : ''}

Preferences:
${input.preferences ? Object.entries(input.preferences).map(([key, value]) => `- ${key}: ${value}`).join('\n') : ''}

Provide detailed local insights in JSON format:

{
  "destination": "${input.destination}",
  "hiddenGems": [
    {
      "name": "Local gem name",
      "type": "landmark|restaurant|viewpoint|market|beach|trail|museum|bar",
      "description": "What makes this place special",
      "location": "Specific location or area",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "bestTime": "When to visit for best experience",
      "cost": "free|low|medium|high",
      "difficulty": "easy|moderate|challenging",
      "insiderTip": "Secret tip only locals know",
      "howToFind": "Directions or landmarks to find it",
      "whySpecial": "What locals love about this place",
      "localName": "Name locals use",
      "estimatedTime": 60
    }
  ],
  "localCulture": [
    {
      "category": "tradition|history|art|religion|lifestyle",
      "title": "Cultural aspect name",
      "description": "Deep explanation of the cultural element",
      "significance": "Why this is important to locals",
      "experienceTips": ["How to respectfully experience this"],
      "bestPlacesToExperience": ["Specific locations"],
      "whatToExpected": "What visitors should expect",
      "respectfulBehavior": ["Do this", "Don't do this"]
    }
  ],
  "foodExperiences": [
    {
      "type": "street-food|local-restaurant|market|cooking-class|food-tour",
      "name": "Food experience name",
      "description": "What makes this food experience unique",
      "mustTryDishes": ["Dish 1", "Dish 2"],
      "location": "Where to find the best version",
      "priceRange": "Cost expectation",
      "localOrderingTips": ["How to order like a local"],
      "culturalContext": "Cultural significance of the food",
      "vegetarianOptions": ["Vegetarian alternatives"],
      "allergyInfo": ["Allergy considerations"]
    }
  ],
  "seasonalHighlights": [
    {
      "season": "${season}",
      "months": ["Month names"],
      "highlights": ["What's special during this season"],
      "weatherExpectation": "Weather description",
      "clothingRecommendation": ["What to pack"],
      "specialEvents": ["Seasonal events"],
      "prosAndCons": {
        "pros": ["Advantages of visiting now"],
        "cons": ["Challenges during this season"]
      },
      "budgetImpact": "cheaper|normal|expensive"
    }
  ],
  "culturalEvents": [
    {
      "name": "Event name",
      "type": "festival|celebration|market|performance|ceremony",
      "description": "What the event is about",
      "dateInfo": "When it happens",
      "location": "Where it takes place",
      "duration": "How long it lasts",
      "cost": "Cost to attend",
      "participationLevel": "observer|participant|both",
      "culturalSignificance": "Why it matters to locals",
      "whatToBring": ["What visitors should bring"],
      "etiquette": ["Proper behavior"],
      "bookingRequired": true,
      "crowdLevel": "low|medium|high"
    }
  ],
  "localTips": [
    {
      "category": "money|transport|communication|shopping|general",
      "tip": "Practical advice",
      "importance": "high|medium|low",
      "context": "When/where this applies"
    }
  ],
  "transportInsights": [
    {
      "mode": "Transport type",
      "description": "How it works",
      "cost": "Price range",
      "pros": ["Advantages"],
      "cons": ["Disadvantages"],
      "bookingTips": ["How to book"],
      "localNames": ["What locals call it"],
      "paymentMethods": ["How to pay"]
    }
  ],
  "safetyTips": [
    {
      "category": "general|transport|money|health|communication",
      "tip": "Safety advice",
      "severity": "info|caution|warning",
      "context": "Specific situation"
    }
  ],
  "weatherInsights": [
    {
      "season": "${season}",
      "temperature": "Temperature range",
      "rainfall": "Rain expectation",
      "humidity": "Humidity level",
      "recommendations": ["Weather-related advice"],
      "whatToPack": ["Weather-appropriate items"]
    }
  ],
  "budgetTips": [
    {
      "category": "Category name",
      "tip": "Money-saving advice",
      "potentialSavings": "How much you can save",
      "difficulty": "easy|medium|hard"
    }
  ],
  "languageGuide": {
    "primaryLanguage": "Main language spoken",
    "commonPhrases": [
      {
        "english": "English phrase",
        "local": "Local translation",
        "pronunciation": "How to pronounce",
        "context": "When to use this"
      }
    ],
    "languageBarriers": ["Communication challenges"],
    "communicationTips": ["How to communicate effectively"]
  },
  "etiquetteGuide": [
    {
      "situation": "Specific situation",
      "dos": ["What to do"],
      "donts": ["What to avoid"],
      "importance": "critical|important|helpful"
    }
  ],
  "emergency": {
    "emergencyNumbers": [
      {
        "service": "Service type",
        "number": "Phone number",
        "notes": "Important notes"
      }
    ],
    "hospitals": [
      {
        "name": "Hospital name",
        "location": "Address",
        "specialization": "What they specialize in"
      }
    ],
    "embassies": [
      {
        "country": "Embassy country",
        "address": "Embassy address",
        "phone": "Contact number"
      }
    ],
    "importantApps": [
      {
        "name": "App name",
        "purpose": "What it's for",
        "downloadLink": "Where to download"
      }
    ]
  },
  "metadata": {
    "generatedAt": "${new Date().toISOString()}",
    "season": "${season}",
    "confidence": 0.9
  }
}

Focus on:
1. Authentic local experiences only locals know about
2. Cultural insights that enhance understanding
3. Practical tips for navigating like a local
4. Hidden gems off the tourist trail
5. Seasonal-specific recommendations
6. Cultural events and festivals during travel period
7. Safety and etiquette guidance
8. Language help for basic interactions
9. Emergency preparedness
10. Budget-friendly local secrets

Make all information specific to ${input.destination} with accurate cultural and practical details.`;
}

function getSeasonFromDates(startDate?: string): string {
  if (!startDate) return 'current';
  
  const date = new Date(startDate);
  const month = date.getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
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
    const input = localInsightsSchema.parse(body);

    // Generate local insights using OpenAI
    const prompt = createLocalInsightsPrompt(input);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable local cultural guide and insider for destinations worldwide. 
          Your expertise includes hidden gems, local customs, cultural events, practical travel tips, and authentic experiences.
          You understand the importance of respectful cultural interaction and provide insights that help travelers connect meaningfully with local culture.
          Always respond with valid JSON that matches the requested structure exactly.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const generatedContent = completion.choices[0]?.message?.content;
    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Parse and validate AI response
    let insights: LocalInsightsResponse;
    try {
      insights = JSON.parse(generatedContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }

    // Add request metadata
    const response = {
      ...insights,
      requestMetadata: {
        userId,
        timestamp: new Date().toISOString(),
        destination: input.destination,
        preferences: input.preferences,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Local insights error:', error);
    
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
      { error: 'Failed to generate local insights' },
      { status: 500 }
    );
  }
}

// GET endpoint for service capabilities
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({
      available: !!process.env.OPENAI_API_KEY,
      capabilities: {
        insightTypes: [
          'hidden-gems',
          'local-culture',
          'food-experiences',
          'seasonal-highlights',
          'cultural-events',
          'transport-insights',
          'safety-tips',
          'language-guide',
          'etiquette-guide',
          'budget-tips'
        ],
        gemTypes: [
          'landmark', 'restaurant', 'viewpoint', 'market', 
          'beach', 'trail', 'museum', 'bar'
        ],
        culturalCategories: [
          'tradition', 'history', 'art', 'religion', 'lifestyle'
        ],
        eventTypes: [
          'festival', 'celebration', 'market', 'performance', 'ceremony'
        ],
        maxDuration: 30,
        languages: [
          'English', 'Spanish', 'French', 'German', 'Italian', 
          'Portuguese', 'Japanese', 'Korean', 'Chinese', 'Hindi'
        ]
      },
      features: [
        'real-time-events',
        'seasonal-recommendations',
        'cultural-sensitivity',
        'local-language-help',
        'safety-guidance',
        'budget-optimization',
        'authentic-experiences'
      ]
    });

  } catch (error) {
    console.error('Local insights service info error:', error);
    return NextResponse.json({ 
      available: false, 
      error: 'Service check failed' 
    });
  }
}