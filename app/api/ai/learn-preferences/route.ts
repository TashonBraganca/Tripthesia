/**
 * AI Preference Learning API - Phase 4.3.1
 * 
 * Handles user preference collection, learning from interactions, and preference updates
 * Integrates with the personalization engine and database schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { withDatabase } from '@/lib/db';
import { 
  userPreferences,
  userInteractions,
  recommendationFeedback,
  UserPreference 
} from '@/lib/database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// ==================== REQUEST SCHEMAS ====================

// Schema for learning from user interactions
const InteractionLearningSchema = z.object({
  interaction: z.object({
    sessionId: z.string(),
    interactionType: z.enum(['search', 'view', 'like', 'dislike', 'book', 'share', 'save', 'skip', 'time_spent', 'click_through', 'comparison', 'filter_apply']),
    targetType: z.string(), // 'destination', 'activity', 'hotel', 'flight'
    targetId: z.string(),
    interactionValue: z.number().optional(),
    contextData: z.record(z.any())
  })
});

// Schema for explicit preference updates
const ExplicitPreferencesSchema = z.object({
  preferences: z.array(z.object({
    type: z.enum([
      'destination_category', 'activity_type', 'accommodation_style', 'cuisine_preference',
      'budget_range', 'trip_pace', 'transport_mode', 'travel_style', 'seasonal_preference',
      'group_composition', 'accessibility_need', 'cultural_interest'
    ]),
    value: z.string(),
    weight: z.number().min(0).max(10).optional().default(1.0)
  }))
});

// Schema for preference queries
const PreferenceQuerySchema = z.object({
  preferenceTypes: z.array(z.string()).optional(),
  includeConfidenceScores: z.boolean().optional().default(false),
  minConfidence: z.number().min(0).max(1).optional().default(0.1)
});

// Rate limiting
const RATE_LIMIT = 100; // requests per hour per user
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// ==================== API HANDLERS ====================

/**
 * POST - Learn preferences from interactions or explicit input
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limiting
    const now = Date.now();
    const userKey = userId;
    const userData = requestCounts.get(userKey);
    
    if (userData && now < userData.resetTime && userData.count >= RATE_LIMIT) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      }, { status: 429 });
    }
    
    // Update rate limiting counter
    if (userData && now < userData.resetTime) {
      userData.count++;
    } else {
      requestCounts.set(userKey, {
        count: 1,
        resetTime: now + 60 * 60 * 1000 // 1 hour
      });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'interaction') {
      return await handleInteractionLearning(userId, body);
    } else if (type === 'explicit') {
      return await handleExplicitPreferences(userId, body);
    } else {
      return NextResponse.json(
        { error: 'Invalid request type. Must be "interaction" or "explicit"' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Preference learning error:', error);
    return NextResponse.json(
      { error: 'Failed to process preference learning request' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve user preferences and learning insights
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      preferenceTypes: searchParams.get('types')?.split(','),
      includeConfidenceScores: searchParams.get('includeConfidence') === 'true',
      minConfidence: parseFloat(searchParams.get('minConfidence') || '0.1')
    };

    const validatedQuery = PreferenceQuerySchema.parse(queryParams);

    return withDatabase(async (db) => {
      // Get user preferences
      const preferences = await db
        .select()
        .from(userPreferences)
        .where(
          and(
            eq(userPreferences.userId, userId),
            validatedQuery.minConfidence > 0 
              ? sql`${userPreferences.confidenceScore}::numeric >= ${validatedQuery.minConfidence}`
              : undefined,
            validatedQuery.preferenceTypes 
              ? sql`${userPreferences.preferenceType} = ANY(${validatedQuery.preferenceTypes})`
              : undefined
          )
        )
        .orderBy(desc(userPreferences.confidenceScore), desc(userPreferences.updatedAt));

      // Get recent interactions for context
      const recentInteractions = await db
        .select({
          interactionType: userInteractions.interactionType,
          targetType: userInteractions.targetType,
          count: sql<number>`count(*)`.as('count')
        })
        .from(userInteractions)
        .where(
          and(
            eq(userInteractions.userId, userId),
            sql`${userInteractions.timestamp} >= NOW() - INTERVAL '30 days'`
          )
        )
        .groupBy(userInteractions.interactionType, userInteractions.targetType)
        .orderBy(sql`count(*) desc`);

      // Calculate preference profile insights
      const preferenceProfile = buildPreferenceProfile(preferences);
      
      return NextResponse.json({
        success: true,
        data: {
          preferences: preferences,
          preferenceProfile,
          insights: {
            totalPreferences: preferences.length,
            highConfidencePreferences: preferences.filter(p => parseFloat(p.confidenceScore) > 0.8).length,
            recentInteractionSummary: recentInteractions,
            lastUpdated: preferences[0]?.updatedAt || null,
            learningStatus: preferences.length > 10 ? 'comprehensive' : preferences.length > 3 ? 'developing' : 'initial'
          },
          metadata: {
            retrievedAt: new Date().toISOString(),
            userId: userId.substring(0, 8) + '***', // Partial for privacy
            version: '4.3.1'
          }
        }
      });
    });
    
  } catch (error) {
    console.error('Get preferences error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to retrieve user preferences' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear user preferences (GDPR compliance)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preferenceType = searchParams.get('type');
    
    return withDatabase(async (db) => {
      if (preferenceType) {
        // Delete specific preference type
        await db
          .delete(userPreferences)
          .where(
            and(
              eq(userPreferences.userId, userId),
              eq(userPreferences.preferenceType, preferenceType as any)
            )
          );
      } else {
        // Delete all preferences
        await db
          .delete(userPreferences)
          .where(eq(userPreferences.userId, userId));
      }

      return NextResponse.json({
        success: true,
        message: preferenceType 
          ? `Deleted all ${preferenceType} preferences` 
          : 'Deleted all user preferences'
      });
    });
    
  } catch (error) {
    console.error('Delete preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to delete preferences' },
      { status: 500 }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Handle learning from user interactions
 */
async function handleInteractionLearning(userId: string, body: any) {
  try {
    const { interaction } = InteractionLearningSchema.parse(body);
    
    return withDatabase(async (db) => {
      // Store the interaction
      await db.insert(userInteractions).values({
        userId,
        sessionId: interaction.sessionId,
        interactionType: interaction.interactionType,
        targetType: interaction.targetType,
        targetId: interaction.targetId,
        interactionValue: interaction.interactionValue?.toString() || null,
        contextData: interaction.contextData
      });

      // Analyze interaction to learn preferences
      const learnedPreferences = await analyzeInteractionForPreferences(interaction);
      
      // Store/update learned preferences
      const updatedPreferences = [];
      for (const pref of learnedPreferences) {
        const result = await upsertPreference(db, userId, pref);
        if (result) updatedPreferences.push(result);
      }

      return NextResponse.json({
        success: true,
        data: {
          interactionStored: true,
          preferencesLearned: updatedPreferences.length,
          preferences: updatedPreferences
        },
        message: `Learned ${updatedPreferences.length} preferences from ${interaction.interactionType} interaction`
      });
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid interaction data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    throw error;
  }
}

/**
 * Handle explicit preference updates
 */
async function handleExplicitPreferences(userId: string, body: any) {
  try {
    const { preferences } = ExplicitPreferencesSchema.parse(body);
    
    return withDatabase(async (db) => {
      const updatedPreferences = [];
      
      for (const pref of preferences) {
        const result = await upsertPreference(db, userId, {
          preferenceType: pref.type,
          preferenceValue: pref.value,
          weight: pref.weight || 1.0,
          confidenceScore: 0.9, // High confidence for explicit input
          learningSource: 'explicit_input',
          contextData: {
            source: 'user_input',
            updatedAt: new Date().toISOString()
          }
        });
        
        if (result) updatedPreferences.push(result);
      }

      return NextResponse.json({
        success: true,
        data: {
          preferencesUpdated: updatedPreferences.length,
          preferences: updatedPreferences
        },
        message: `Updated ${updatedPreferences.length} explicit preferences`
      });
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid preference data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    throw error;
  }
}

/**
 * Analyze interaction to extract preferences
 */
async function analyzeInteractionForPreferences(interaction: any) {
  const preferences = [];
  
  // Destination category inference
  if (interaction.targetType === 'destination') {
    const category = await inferDestinationCategory(interaction.targetId);
    if (category) {
      preferences.push({
        preferenceType: 'destination_category',
        preferenceValue: category,
        weight: calculateInteractionWeight(interaction.interactionType, interaction.interactionValue),
        confidenceScore: calculateConfidence(interaction.interactionType),
        learningSource: 'implicit_behavior',
        contextData: {
          interactionType: interaction.interactionType,
          targetType: interaction.targetType,
          targetId: interaction.targetId,
          learnedAt: new Date().toISOString()
        }
      });
    }
  }
  
  // Activity type inference
  if (interaction.targetType === 'activity') {
    const activityType = await inferActivityType(interaction.targetId);
    if (activityType) {
      preferences.push({
        preferenceType: 'activity_type',
        preferenceValue: activityType,
        weight: calculateInteractionWeight(interaction.interactionType, interaction.interactionValue),
        confidenceScore: calculateConfidence(interaction.interactionType),
        learningSource: 'implicit_behavior',
        contextData: {
          interactionType: interaction.interactionType,
          targetType: interaction.targetType,
          targetId: interaction.targetId,
          learnedAt: new Date().toISOString()
        }
      });
    }
  }
  
  // Budget range inference
  if (interaction.contextData.budgetRange) {
    preferences.push({
      preferenceType: 'budget_range',
      preferenceValue: interaction.contextData.budgetRange,
      weight: 1.0,
      confidenceScore: 0.7,
      learningSource: 'implicit_behavior',
      contextData: {
        interactionType: interaction.interactionType,
        inferredFrom: 'search_filters',
        learnedAt: new Date().toISOString()
      }
    });
  }
  
  return preferences;
}

/**
 * Calculate interaction weight based on type and value
 */
function calculateInteractionWeight(interactionType: string, value?: number): number {
  const weights: Record<string, number> = {
    'like': 2.0,
    'dislike': -2.0,
    'book': 3.0,
    'save': 1.5,
    'share': 1.8,
    'view': 0.5,
    'skip': -0.8,
    'time_spent': (value || 0) / 60, // Convert seconds to minutes
    'click_through': 1.2,
    'comparison': 1.0,
    'search': 0.3,
    'filter_apply': 0.8
  };
  
  return weights[interactionType] || 0.5;
}

/**
 * Calculate confidence score based on interaction type
 */
function calculateConfidence(interactionType: string): number {
  const confidenceMap: Record<string, number> = {
    'book': 0.95,
    'like': 0.8,
    'dislike': 0.8,
    'save': 0.7,
    'share': 0.75,
    'time_spent': 0.6,
    'view': 0.4,
    'search': 0.3,
    'skip': 0.5,
    'click_through': 0.5,
    'comparison': 0.6,
    'filter_apply': 0.65
  };
  
  return confidenceMap[interactionType] || 0.5;
}

/**
 * Upsert a user preference (update if exists, insert if not)
 */
async function upsertPreference(db: any, userId: string, preferenceData: any) {
  // Check if preference already exists
  const existing = await db
    .select()
    .from(userPreferences)
    .where(
      and(
        eq(userPreferences.userId, userId),
        eq(userPreferences.preferenceType, preferenceData.preferenceType),
        eq(userPreferences.preferenceValue, preferenceData.preferenceValue)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing preference with weighted average
    const currentWeight = parseFloat(existing[0].preferenceWeight);
    const currentConfidence = parseFloat(existing[0].confidenceScore);
    
    const newWeight = (currentWeight + preferenceData.weight) / 2;
    const newConfidence = Math.min(1.0, (currentConfidence + preferenceData.confidenceScore) / 2);
    
    const [updated] = await db
      .update(userPreferences)
      .set({
        preferenceWeight: newWeight.toString(),
        confidenceScore: newConfidence.toString(),
        contextData: {
          ...existing[0].contextData,
          ...preferenceData.contextData,
          lastUpdated: new Date().toISOString(),
          updateCount: ((existing[0].contextData as any)?.updateCount || 0) + 1
        },
        updatedAt: new Date()
      })
      .where(eq(userPreferences.id, existing[0].id))
      .returning();
      
    return updated;
  } else {
    // Insert new preference
    const [inserted] = await db
      .insert(userPreferences)
      .values({
        userId,
        preferenceType: preferenceData.preferenceType,
        preferenceValue: preferenceData.preferenceValue,
        preferenceWeight: preferenceData.weight.toString(),
        confidenceScore: preferenceData.confidenceScore.toString(),
        learningSource: preferenceData.learningSource,
        contextData: preferenceData.contextData
      })
      .returning();
      
    return inserted;
  }
}

/**
 * Build preference profile summary
 */
function buildPreferenceProfile(preferences: UserPreference[]) {
  const profile: Record<string, any> = {
    categories: {},
    strongPreferences: [],
    emergingPreferences: []
  };
  
  // Group by preference type
  preferences.forEach(pref => {
    const type = pref.preferenceType;
    if (!profile.categories[type]) {
      profile.categories[type] = [];
    }
    
    profile.categories[type].push({
      value: pref.preferenceValue,
      weight: parseFloat(pref.preferenceWeight),
      confidence: parseFloat(pref.confidenceScore),
      source: pref.learningSource
    });
    
    // Categorize by confidence
    const confidence = parseFloat(pref.confidenceScore);
    if (confidence > 0.8) {
      profile.strongPreferences.push({
        type,
        value: pref.preferenceValue,
        confidence
      });
    } else if (confidence > 0.5) {
      profile.emergingPreferences.push({
        type,
        value: pref.preferenceValue,
        confidence
      });
    }
  });
  
  return profile;
}

/**
 * Mock functions for inferring categories (in real implementation, these would use ML or databases)
 */
async function inferDestinationCategory(destinationId: string): Promise<string | null> {
  // In real implementation, this would analyze destination data
  const categories = ['beach', 'mountain', 'city', 'cultural', 'adventure', 'nature'];
  return categories[Math.floor(Math.random() * categories.length)];
}

async function inferActivityType(activityId: string): Promise<string | null> {
  // In real implementation, this would analyze activity data
  const types = ['outdoor', 'cultural', 'adventure', 'relaxation', 'nightlife', 'food'];
  return types[Math.floor(Math.random() * types.length)];
}