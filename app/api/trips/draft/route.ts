import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { draftTrips } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for draft trip data
const draftTripSchema = z.object({
  currentStep: z.enum(['destination', 'transport', 'rental', 'accommodation', 'activities', 'dining']),
  completedSteps: z.array(z.string()),
  formData: z.object({
    from: z.any().nullable(),
    to: z.any().nullable(),
    startDate: z.string(),
    endDate: z.string(),
    tripType: z.string(),
    travelers: z.number(),
    budget: z.number(),
    transport: z.any().optional(),
    rental: z.any().optional(),
    accommodation: z.any().optional(),
    activities: z.any().optional(),
    dining: z.any().optional(),
  }),
  stepData: z.any().optional(),
  title: z.string().optional(),
});

// GET: Retrieve user's draft trips
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const drafts = await db
      .select()
      .from(draftTrips)
      .where(eq(draftTrips.userId, userId))
      .orderBy(desc(draftTrips.lastSaved))
      .limit(10); // Limit to 10 most recent drafts

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching draft trips:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save/update draft trip
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = draftTripSchema.parse(body);

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Check if there's an existing draft to update
    const existingDrafts = await db
      .select()
      .from(draftTrips)
      .where(eq(draftTrips.userId, userId))
      .orderBy(desc(draftTrips.lastSaved))
      .limit(1);

    let result;

    if (existingDrafts.length > 0) {
      // Update existing draft
      result = await db
        .update(draftTrips)
        .set({
          currentStep: validatedData.currentStep,
          completedSteps: validatedData.completedSteps,
          formData: validatedData.formData,
          stepData: validatedData.stepData,
          title: validatedData.title,
          lastSaved: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(draftTrips.id, existingDrafts[0].id))
        .returning();
    } else {
      // Create new draft
      result = await db
        .insert(draftTrips)
        .values({
          userId,
          currentStep: validatedData.currentStep,
          completedSteps: validatedData.completedSteps,
          formData: validatedData.formData,
          stepData: validatedData.stepData,
          title: validatedData.title,
        })
        .returning();
    }

    return NextResponse.json({ 
      success: true, 
      draft: result[0],
      message: existingDrafts.length > 0 ? 'Draft updated' : 'Draft created'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error saving draft trip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove draft trip
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Delete the draft, ensuring it belongs to the user
    const result = await db
      .delete(draftTrips)
      .where(
        eq(draftTrips.id, draftId) && eq(draftTrips.userId, userId)
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Draft deleted' });
  } catch (error) {
    console.error('Error deleting draft trip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}