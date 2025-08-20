import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { checkPaytmTransactionStatus } from "@/lib/paytm";

export const runtime = 'nodejs';

const statusSchema = z.object({
  orderId: z.string(),
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
    const { orderId } = statusSchema.parse(body);

    // Check transaction status with Paytm
    const status = await checkPaytmTransactionStatus(orderId);

    return NextResponse.json({
      orderId,
      status: status.STATUS,
      txnId: status.TXNID,
      amount: status.TXNAMOUNT,
      respCode: status.RESPCODE,
      respMsg: status.RESPMSG,
      paymentMode: status.PAYMENTMODE,
      txnDate: status.TXNDATE,
    });

  } catch (error) {
    console.error('Paytm status check failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check transaction status' },
      { status: 500 }
    );
  }
}