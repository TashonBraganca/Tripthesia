import { NextRequest, NextResponse } from "next/server";
import { verifyPaytmResponse, PAYTM_STATUS, checkPaytmTransactionStatus } from "@/lib/paytm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { trackEvent } from "@/lib/monitoring";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Handle both form data and JSON
    let paytmParams: any = {};
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        paytmParams[key] = value;
      }
    } else {
      paytmParams = await request.json();
    }

    console.log('Paytm callback received:', paytmParams);

    // Verify Paytm response signature
    const isValidSignature = await verifyPaytmResponse(paytmParams);
    
    if (!isValidSignature) {
      console.error('Invalid Paytm signature');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=invalid_signature`);
    }

    const orderId = paytmParams.ORDERID;
    const userId = paytmParams.CUSTID;
    const status = paytmParams.STATUS;
    const txnId = paytmParams.TXNID;

    // Double-check transaction status with Paytm
    try {
      const statusCheck = await checkPaytmTransactionStatus(orderId);
      console.log('Paytm status check response:', statusCheck);
      
      // Use the status from status check if available
      if (statusCheck.STATUS) {
        paytmParams.STATUS = statusCheck.STATUS;
      }
    } catch (statusError) {
      console.error('Failed to check transaction status:', statusError);
      // Continue with the callback status if status check fails
    }

    // Track the callback
    trackEvent('paytm_callback_received', {
      orderId,
      userId,
      status: paytmParams.STATUS,
      txnId,
      amount: paytmParams.TXNAMOUNT,
    }, userId);

    // Check if payment was successful
    if (paytmParams.STATUS === PAYTM_STATUS.SUCCESS) {
      try {
        // Update user subscription in database
        await db
          .update(profiles)
          .set({
            subscriptionTier: 'pro',
            subscriptionStatus: 'active',
            paytmTransactionId: txnId,
            paytmOrderId: orderId,
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, userId));

        console.log(`✅ Payment successful for user ${userId}, order ${orderId}`);

        // Track successful payment
        trackEvent('paytm_payment_successful', {
          userId,
          orderId,
          txnId,
          amount: paytmParams.TXNAMOUNT,
          paymentMode: paytmParams.PAYMENTMODE,
        }, userId);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true&payment=success`);

      } catch (dbError) {
        console.error('Database update failed:', dbError);
        
        // Track failed subscription activation
        trackEvent('paytm_subscription_activation_failed', {
          userId,
          orderId,
          txnId,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
        }, userId);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=activation_failed`);
      }
      
    } else {
      // Payment failed
      console.log(`❌ Payment failed for user ${userId}, order ${orderId}, status: ${paytmParams.STATUS}`);
      
      // Track failed payment
      trackEvent('paytm_payment_failed', {
        userId,
        orderId,
        status: paytmParams.STATUS,
        respCode: paytmParams.RESPCODE,
        respMsg: paytmParams.RESPMSG,
      }, userId);

      const errorMsg = paytmParams.RESPMSG || 'payment_failed';
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=${encodeURIComponent(errorMsg)}`);
    }

  } catch (error) {
    console.error('Paytm callback processing failed:', error);
    
    trackEvent('paytm_callback_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=callback_failed`);
  }
}

// Handle GET requests (some payment gateways might use GET for callbacks)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paytmParams: any = {};
  
  // Convert search params to object
  for (const [key, value] of searchParams.entries()) {
    paytmParams[key] = value;
  }

  // Create a new request with the params as JSON body
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(paytmParams),
  });

  return POST(postRequest);
}