import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { trips, itineraries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { generatePDF } from "@/lib/export/pdf-generator";
import { generateICS } from "@/lib/export/ics-generator";

const exportSchema = z.object({
  format: z.enum(["pdf", "ics"]),
  options: z.object({
    includePricing: z.boolean().default(true),
    includeMap: z.boolean().default(true),
    includeActivities: z.boolean().default(true),
    includeNotes: z.boolean().default(true),
    timezone: z.string().default("UTC"),
  }).default({}),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Rate limiting
    const { success } = await rateLimit(userId, 10, 300); // 10 exports per 5 minutes
    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }

    // Validate request body
    const body = await request.json();
    const { format, options } = exportSchema.parse(body);

    // Verify trip ownership and get data
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, params.id), eq(trips.userId, userId)))
      .limit(1);

    if (!trip.length) {
      return new Response("Trip not found", { status: 404 });
    }

    // Get latest itinerary
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.tripId, params.id))
      .orderBy(desc(itineraries.version))
      .limit(1);

    if (!itinerary.length) {
      return new Response("No itinerary found", { status: 404 });
    }

    const tripData = trip[0];
    const itineraryData = itinerary[0];

    // Generate export based on format
    if (format === "pdf") {
      const pdfBuffer = await generatePDF(tripData, itineraryData.data, options);
      
      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="trip-${tripData.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } else if (format === "ics") {
      const icsContent = generateICS(tripData, itineraryData.data, options);
      
      return new Response(icsContent, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="trip-${tripData.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`,
        },
      });
    }

    return new Response("Invalid format", { status: 400 });

  } catch (error) {
    console.error("Export endpoint error:", error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}