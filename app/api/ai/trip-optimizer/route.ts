import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Input validation schema
const optimizerSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  tripData: z.object({
    transport: z.any().optional(),
    accommodation: z.array(z.any()).optional(),
    activities: z.array(z.any()).optional(),
    dining: z.array(z.any()).optional(),
    dates: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    travelers: z.number().optional(),
    budget: z.number().optional()
  }),
  preferences: z.object({
    optimizeFor: z.array(z.enum(['cost', 'time', 'experience', 'convenience'])),
    priorityOrder: z.array(z.string()).optional()
  }).optional()
});

type OptimizerInput = z.infer<typeof optimizerSchema>;

interface OptimizationSuggestion {
  id: string;
  type: 'cost' | 'time' | 'experience' | 'convenience';
  title: string;
  description: string;
  impact: {
    costSaving?: number;
    timeSaving?: string;
    experienceScore?: number;
    convenienceScore?: number;
  };
  suggestions: {
    step: string;
    current: string;
    suggested: string;
    reason: string;
  }[];
  priority: 'high' | 'medium' | 'low';
  category: string;
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = optimizerSchema.parse(body);
    
    const optimizations = await generateTripOptimizations(validatedData);

    return NextResponse.json({
      success: true,
      optimizations,
      metadata: {
        destination: validatedData.destination,
        analysisDate: new Date().toISOString(),
        optimizationCount: optimizations.length
      }
    });

  } catch (error) {
    console.error('Trip optimization error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate trip optimizations' },
      { status: 500 }
    );
  }
}

async function generateTripOptimizations(input: OptimizerInput): Promise<OptimizationSuggestion[]> {
  try {
    if (!openai) {
      // Fallback to mock data when OpenAI is not available
      return generateMockOptimizations(input);
    }

    const prompt = `
You are a travel optimization expert. Analyze the following trip data and provide optimization suggestions.

Destination: ${input.destination}
Trip Data: ${JSON.stringify(input.tripData, null, 2)}
Optimization Preferences: ${JSON.stringify(input.preferences, null, 2)}

Please analyze the trip and provide optimization suggestions in the following categories:
1. Cost optimization (ways to save money while maintaining quality)
2. Time optimization (ways to save time and improve efficiency)
3. Experience optimization (ways to enhance the travel experience)
4. Convenience optimization (ways to make travel more convenient)

For each suggestion, provide:
- A clear title and description
- Quantified impact (cost savings, time savings, experience score, convenience score)
- Specific suggestions for each trip component
- Priority level (high/medium/low)
- Category classification

Focus on practical, actionable suggestions based on the selected trip components.
Consider factors like:
- Budget constraints and value optimization
- Travel time and logistics
- Seasonal considerations
- Local preferences and authentic experiences
- Group size and travel style
- Transportation connections and efficiency

Return the response as a valid JSON array of optimization suggestions.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel advisor specializing in trip optimization. Provide practical, data-driven suggestions to improve travel experiences while considering cost, time, experience quality, and convenience factors.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const aiResponse = JSON.parse(response);
    
    // Validate and format the AI response
    const optimizations = aiResponse.optimizations || aiResponse.suggestions || [];
    
    return optimizations.map((opt: any, index: number) => ({
      id: `ai-opt-${Date.now()}-${index}`,
      type: opt.type || 'experience',
      title: opt.title || 'Optimization Suggestion',
      description: opt.description || 'AI-generated optimization suggestion',
      impact: {
        costSaving: opt.impact?.costSaving || opt.costSaving,
        timeSaving: opt.impact?.timeSaving || opt.timeSaving,
        experienceScore: opt.impact?.experienceScore || opt.experienceScore,
        convenienceScore: opt.impact?.convenienceScore || opt.convenienceScore
      },
      suggestions: opt.suggestions || [{
        step: opt.step || 'general',
        current: opt.current || 'Current selection',
        suggested: opt.suggested || 'Optimized alternative',
        reason: opt.reason || 'AI-optimized recommendation'
      }],
      priority: opt.priority || 'medium',
      category: opt.category || 'General Optimization'
    }));

  } catch (error) {
    console.error('OpenAI optimization error:', error);
    // Fallback to mock data
    return generateMockOptimizations(input);
  }
}

function generateMockOptimizations(input: OptimizerInput): OptimizationSuggestion[] {
  const optimizations: OptimizationSuggestion[] = [];

  // Cost optimization suggestions
  if (input.tripData.accommodation && input.tripData.accommodation.length > 0) {
    optimizations.push({
      id: 'cost-1',
      type: 'cost',
      title: 'Optimize Accommodation Budget',
      description: 'Switch to highly-rated mid-range hotels to save 25-40% without compromising comfort.',
      impact: {
        costSaving: Math.floor(Math.random() * 5000) + 2000,
        experienceScore: 4.2
      },
      suggestions: [{
        step: 'accommodation',
        current: 'Luxury hotels selected',
        suggested: 'Business/mid-range hotels with excellent ratings',
        reason: 'Similar amenities and quality at significantly lower prices'
      }],
      priority: 'high',
      category: 'Budget Optimization'
    });
  }

  // Time optimization suggestions
  if (input.tripData.activities && input.tripData.activities.length > 1) {
    optimizations.push({
      id: 'time-1',
      type: 'time',
      title: 'Optimize Activity Routing',
      description: 'Reorder activities by geographical proximity to minimize travel time.',
      impact: {
        timeSaving: `${Math.floor(Math.random() * 3) + 2} hours/day`,
        convenienceScore: 4.6
      },
      suggestions: [{
        step: 'activities',
        current: 'Activities in selected order',
        suggested: 'Geographically clustered activity sequence',
        reason: 'Reduce travel time between locations and maximize exploration time'
      }],
      priority: 'high',
      category: 'Time Efficiency'
    });
  }

  // Experience optimization suggestions
  if (input.tripData.dining && input.tripData.dining.length > 0) {
    optimizations.push({
      id: 'experience-1',
      type: 'experience',
      title: 'Enhance Local Culinary Experience',
      description: 'Include authentic local dining experiences alongside your selected preferences.',
      impact: {
        experienceScore: 4.8,
        costSaving: 0
      },
      suggestions: [{
        step: 'dining',
        current: 'Current dining preferences',
        suggested: 'Mix of local specialties and preferred cuisines',
        reason: 'Experience authentic local culture through traditional cuisine'
      }],
      priority: 'medium',
      category: 'Cultural Experience'
    });
  }

  // Convenience optimization suggestions
  if (input.tripData.transport) {
    optimizations.push({
      id: 'convenience-1',
      type: 'convenience',
      title: 'Improve Transport Connectivity',
      description: 'Select transport options with better connections to your accommodation and activities.',
      impact: {
        timeSaving: '30-60 min per transfer',
        convenienceScore: 4.4
      },
      suggestions: [{
        step: 'transport',
        current: 'Current transport selection',
        suggested: 'Better connected transport options',
        reason: 'Reduce wait times and improve overall travel convenience'
      }],
      priority: 'medium',
      category: 'Travel Convenience'
    });
  }

  // Weather and seasonal optimization
  if (input.tripData.dates) {
    const startDate = new Date(input.tripData.dates.start);
    const month = startDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    if ([6, 7, 8, 9].includes(month)) { // Monsoon months
      optimizations.push({
        id: 'seasonal-1',
        type: 'experience',
        title: 'Monsoon Season Optimization',
        description: 'Adjust activities and add indoor alternatives for the monsoon season.',
        impact: {
          experienceScore: 4.5,
          convenienceScore: 4.2
        },
        suggestions: [{
          step: 'activities',
          current: 'Outdoor-focused activities',
          suggested: 'Mix of indoor and covered outdoor activities',
          reason: 'Ensure enjoyable experiences regardless of weather conditions'
        }],
        priority: 'high',
        category: 'Seasonal Optimization'
      });
    }
  }

  return optimizations.slice(0, 4); // Return top 4 optimizations
}