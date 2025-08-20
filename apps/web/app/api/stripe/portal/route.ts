import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createCustomerPortalSession, getCustomerByUserId } from "@/lib/stripe";
import { trackEvent } from "@/lib/monitoring";

export const runtime = 'nodejs';

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { returnUrl } = portalSchema.parse(body);

    // Find customer by user ID
    const customer = await getCustomerByUserId(userId);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Default return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const defaultReturnUrl = `${baseUrl}/account/billing`;

    // Create customer portal session
    const session = await createCustomerPortalSession(
      customer.id,
      returnUrl || defaultReturnUrl
    );

    // Track portal access
    trackEvent('billing_portal_accessed', {
      userId,
      customerId: customer.id,
    }, userId);

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Customer portal session creation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}