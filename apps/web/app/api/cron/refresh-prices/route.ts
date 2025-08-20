import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceQuotes } from "@/lib/db/schema";
import { lte } from "drizzle-orm";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('🔄 Starting price refresh cron job');

  try {
    // Find price quotes expiring in the next 2 hours
    const expiringQuotes = await db
      .select()
      .from(priceQuotes)
      .where(lte(priceQuotes.expiresAt, new Date(Date.now() + 2 * 60 * 60 * 1000)))
      .limit(100); // Process in batches

    console.log(`📊 Found ${expiringQuotes.length} expiring price quotes`);

    let refreshedCount = 0;
    let errorCount = 0;

    // Process in smaller batches to avoid timeouts
    const batchSize = 10;
    for (let i = 0; i < expiringQuotes.length; i += batchSize) {
      const batch = expiringQuotes.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (quote) => {
          try {
            // Refresh price based on item type
            await refreshPriceQuote(quote);
            refreshedCount++;
          } catch (error) {
            console.error(`Failed to refresh quote ${quote.id}:`, error);
            errorCount++;
          }
        })
      );

      // Rate limiting between batches
      if (i + batchSize < expiringQuotes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;

    const response = {
      success: true,
      processed: expiringQuotes.length,
      refreshed: refreshedCount,
      errors: errorCount,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Price refresh completed:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Price refresh cron failed:', error);
    return NextResponse.json(
      { 
        error: 'Price refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function refreshPriceQuote(quote: any) {
  // This would integrate with actual pricing APIs
  // For now, we'll simulate the refresh with extended expiry
  const newExpiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db
    .update(priceQuotes)
    .set({ 
      expiresAt: newExpiryTime,
      // In real implementation, we'd also update the amount and url
    })
    .where(priceQuotes.id.eq(quote.id));

  console.log(`💰 Refreshed price quote ${quote.id} for ${quote.itemType}`);
}

// Helper function to simulate delay
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}