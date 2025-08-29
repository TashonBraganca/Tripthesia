import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Input validation schema
const budgetOptimizerSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  totalBudget: z.number().min(0, 'Budget must be positive'),
  currency: z.enum(['USD', 'INR']),
  duration: z.number().min(1).max(30, 'Duration must be between 1-30 days'),
  groupSize: z.number().min(1).max(20),
  currentItinerary: z.array(z.object({
    title: z.string(),
    category: z.string(),
    estimatedCost: z.number(),
    priority: z.enum(['high', 'medium', 'low']),
    duration: z.number(),
    date: z.string(),
  })),
  preferences: z.object({
    accommodationType: z.enum(['budget', 'mid-range', 'luxury']).optional(),
    foodStyle: z.enum(['street-food', 'local-restaurants', 'fine-dining', 'mixed']).optional(),
    transportMode: z.enum(['public', 'taxi', 'rental-car', 'mixed']).optional(),
    prioritizeExperiences: z.boolean().optional(),
    flexibleSchedule: z.boolean().optional(),
  }),
  constraints: z.object({
    maxDailyBudget: z.number().optional(),
    mustHaveActivities: z.array(z.string()).optional(),
    cannotReduceCategories: z.array(z.string()).optional(),
  }).optional(),
});

type BudgetOptimizerInput = z.infer<typeof budgetOptimizerSchema>;

interface BudgetOptimization {
  originalBudget: {
    total: number;
    breakdown: Record<string, number>;
    currency: string;
  };
  optimizedBudget: {
    total: number;
    breakdown: Record<string, number>;
    currency: string;
    savings: number;
    savingsPercentage: number;
  };
  recommendations: BudgetRecommendation[];
  alternatives: ActivityAlternative[];
  costSavingStrategies: CostSavingStrategy[];
  budgetAllocation: BudgetAllocation;
  riskAnalysis: {
    potentialOverspend: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  dailyBudgetPlan: DailyBudgetPlan[];
}

interface BudgetRecommendation {
  category: string;
  currentCost: number;
  suggestedCost: number;
  savings: number;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  actionItems: string[];
}

interface ActivityAlternative {
  originalActivity: string;
  alternatives: {
    title: string;
    description: string;
    cost: number;
    costDifference: number;
    experienceRating: number;
    pros: string[];
    cons: string[];
  }[];
}

interface CostSavingStrategy {
  category: string;
  strategy: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  steps: string[];
}

interface BudgetAllocation {
  recommended: Record<string, { amount: number; percentage: number }>;
  current: Record<string, { amount: number; percentage: number }>;
  adjustments: Record<string, number>;
}

interface DailyBudgetPlan {
  date: string;
  plannedSpending: number;
  categories: Record<string, number>;
  bufferAmount: number;
  tips: string[];
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createBudgetOptimizationPrompt(input: BudgetOptimizerInput): string {
  const currentTotal = input.currentItinerary.reduce((sum, item) => sum + item.estimatedCost, 0);
  const overBudget = currentTotal > input.totalBudget;
  const budgetDifference = Math.abs(currentTotal - input.totalBudget);
  
  const currentBreakdown = input.currentItinerary.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.estimatedCost;
    return acc;
  }, {} as Record<string, number>);

  return `Analyze and optimize the travel budget for ${input.destination}.

Current Situation:
- Total Budget: ${input.totalBudget} ${input.currency}
- Current Itinerary Cost: ${currentTotal} ${input.currency}
- ${overBudget ? 'OVER BUDGET' : 'UNDER BUDGET'} by ${budgetDifference} ${input.currency}
- Duration: ${input.duration} days
- Group Size: ${input.groupSize} people

Current Cost Breakdown:
${Object.entries(currentBreakdown).map(([cat, cost]) => `- ${cat}: ${cost} ${input.currency}`).join('\n')}

Current Activities:
${input.currentItinerary.map(item => 
  `- ${item.title} (${item.category}): ${item.estimatedCost} ${input.currency} [${item.priority} priority]`
).join('\n')}

User Preferences:
- Accommodation: ${input.preferences.accommodationType || 'not specified'}
- Food Style: ${input.preferences.foodStyle || 'not specified'}
- Transport: ${input.preferences.transportMode || 'not specified'}
- Prioritize Experiences: ${input.preferences.prioritizeExperiences ? 'Yes' : 'No'}
- Flexible Schedule: ${input.preferences.flexibleSchedule ? 'Yes' : 'No'}

Constraints:
${input.constraints?.maxDailyBudget ? `- Max daily budget: ${input.constraints.maxDailyBudget} ${input.currency}` : ''}
${input.constraints?.mustHaveActivities?.length ? `- Must include: ${input.constraints.mustHaveActivities.join(', ')}` : ''}
${input.constraints?.cannotReduceCategories?.length ? `- Cannot reduce: ${input.constraints.cannotReduceCategories.join(', ')}` : ''}

Please provide a comprehensive budget optimization in JSON format:

{
  "originalBudget": {
    "total": ${currentTotal},
    "breakdown": ${JSON.stringify(currentBreakdown)},
    "currency": "${input.currency}"
  },
  "optimizedBudget": {
    "total": 0,
    "breakdown": {},
    "currency": "${input.currency}",
    "savings": 0,
    "savingsPercentage": 0
  },
  "recommendations": [
    {
      "category": "accommodation",
      "currentCost": 500,
      "suggestedCost": 400,
      "savings": 100,
      "reasoning": "Switch from hotels to well-reviewed guesthouses",
      "impact": "low",
      "actionItems": ["Research guesthouses", "Check reviews", "Book early"]
    }
  ],
  "alternatives": [
    {
      "originalActivity": "Activity name",
      "alternatives": [
        {
          "title": "Alternative name",
          "description": "Why this is a good alternative",
          "cost": 50,
          "costDifference": -25,
          "experienceRating": 4.2,
          "pros": ["Lower cost", "Authentic experience"],
          "cons": ["Requires more time"]
        }
      ]
    }
  ],
  "costSavingStrategies": [
    {
      "category": "general",
      "strategy": "Travel during shoulder season",
      "potentialSavings": 200,
      "difficulty": "easy",
      "description": "Detailed explanation of the strategy",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "budgetAllocation": {
    "recommended": {
      "accommodation": {"amount": 400, "percentage": 40},
      "food": {"amount": 300, "percentage": 30}
    },
    "current": {
      "accommodation": {"amount": 500, "percentage": 50}
    },
    "adjustments": {
      "accommodation": -100,
      "activities": 50
    }
  },
  "riskAnalysis": {
    "potentialOverspend": 150,
    "confidenceLevel": "medium",
    "riskFactors": ["Peak season pricing", "Currency fluctuation"],
    "mitigationStrategies": ["Book accommodations early", "Set daily spending limits"]
  },
  "dailyBudgetPlan": [
    {
      "date": "2025-09-01",
      "plannedSpending": 120,
      "categories": {
        "accommodation": 80,
        "food": 30,
        "activities": 10
      },
      "bufferAmount": 15,
      "tips": ["Start early to avoid crowds", "Have breakfast included"]
    }
  ]
}

Focus on:
1. Realistic cost optimization without compromising experience quality
2. Alternative activities that provide similar value at lower cost
3. Practical money-saving strategies specific to ${input.destination}
4. Daily budget distribution to prevent overspending
5. Risk assessment for budget adherence
6. Respecting user preferences and constraints
7. Considering group size impact on costs

Make all suggestions practical and actionable with specific cost figures.`;
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
    const input = budgetOptimizerSchema.parse(body);

    // Generate budget optimization using OpenAI
    const prompt = createBudgetOptimizationPrompt(input);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a financial travel advisor with expertise in budget optimization for destinations worldwide. 
          You understand local pricing, cost-saving strategies, and how to maintain travel quality while reducing expenses.
          Provide realistic, practical advice with specific cost figures and actionable recommendations.
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
    let optimization: BudgetOptimization;
    try {
      optimization = JSON.parse(generatedContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }

    // Add metadata
    const response = {
      ...optimization,
      metadata: {
        generatedAt: new Date().toISOString(),
        destination: input.destination,
        originalBudget: input.totalBudget,
        optimizationType: 'ai-powered',
        userId,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Budget optimization error:', error);
    
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
      { error: 'Failed to optimize budget' },
      { status: 500 }
    );
  }
}

// GET endpoint for budget optimization capabilities
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({
      available: !!process.env.OPENAI_API_KEY,
      capabilities: {
        maxBudget: 100000, // Max budget in USD
        minBudget: 100,
        maxDuration: 30,
        maxGroupSize: 20,
        supportedCurrencies: ['USD', 'INR'],
        optimizationTypes: [
          'cost-reduction',
          'value-maximization',
          'experience-priority',
          'balanced-approach'
        ],
        features: [
          'alternative-activities',
          'daily-budget-planning',
          'risk-analysis',
          'cost-saving-strategies',
          'category-reallocation'
        ]
      },
      budgetRules: {
        accommodation: { min: 20, max: 50, recommended: 30 }, // percentage
        food: { min: 15, max: 35, recommended: 25 },
        activities: { min: 15, max: 40, recommended: 25 },
        transportation: { min: 10, max: 30, recommended: 15 },
        miscellaneous: { min: 5, max: 15, recommended: 5 },
      }
    });

  } catch (error) {
    console.error('Budget optimizer service info error:', error);
    return NextResponse.json({ 
      available: false, 
      error: 'Service check failed' 
    });
  }
}