import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
// Temporarily disabled for deployment
// import { searchPlaces } from "@tripthesia/agents";

export async function GET() {
  return Response.json({ error: 'Places search temporarily unavailable during deployment' }, { status: 503 });
}

/*
import { rateLimit } from "@/lib/rate-limit";

const searchSchema = z.object({
  q: z.string().min(2),
  type: z.enum(["city", "poi", "all"]).default("all"),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? "anonymous";
    const { success } = await rateLimit(identifier, 20, 60); // 20 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validation = searchSchema.safeParse({
      q: searchParams.get("q"),
      type: searchParams.get("type"),
      limit: searchParams.get("limit"),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { q: query, type, limit } = validation.data;

    // Search for places
    const results = await searchPlaces({
      query,
      location: null, // Global search
      category: type === "city" ? "city" : undefined,
      limit,
    });

    // Transform results for frontend
    const suggestions = results.map((place) => ({
      name: place.name,
      displayName: `${place.name}${place.address ? `, ${place.address}` : ""}`,
      coordinates: place.coordinates,
      placeId: place.fsq_id,
      country: place.country || "Unknown",
      region: place.region,
    }));

    return NextResponse.json({
      results: suggestions,
      count: suggestions.length,
    });

  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
*/