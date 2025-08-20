import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { trips, sharedTrips } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { rateLimit } from "@/lib/rate-limit";

const shareSchema = z.object({
  action: z.enum(["create", "revoke", "update"]),
  settings: z.object({
    isPublic: z.boolean().default(false),
    allowComments: z.boolean().default(false),
    expiresAt: z.string().optional(),
    permissions: z.array(z.enum(["view", "comment", "edit"])).default(["view"]),
  }).optional(),
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
    const { success } = await rateLimit(userId, 20, 300); // 20 share operations per 5 minutes
    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }

    // Validate request body
    const body = await request.json();
    const { action, settings } = shareSchema.parse(body);

    // Verify trip ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, params.id), eq(trips.userId, userId)))
      .limit(1);

    if (!trip.length) {
      return new Response("Trip not found", { status: 404 });
    }

    const tripData = trip[0];

    if (action === "create") {
      // Create a new share link
      const shareId = nanoid(12); // Short, URL-safe ID
      const expiresAt = settings?.expiresAt ? new Date(settings.expiresAt) : null;

      await db.insert(sharedTrips).values({
        id: shareId,
        tripId: params.id,
        createdBy: userId,
        isPublic: settings?.isPublic || false,
        allowComments: settings?.allowComments || false,
        permissions: settings?.permissions || ["view"],
        expiresAt,
        createdAt: new Date(),
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const shareUrl = `${baseUrl}/shared/${shareId}`;

      return Response.json({
        success: true,
        shareId,
        shareUrl,
        settings: {
          isPublic: settings?.isPublic || false,
          allowComments: settings?.allowComments || false,
          permissions: settings?.permissions || ["view"],
          expiresAt: expiresAt?.toISOString() || null,
        },
      });

    } else if (action === "revoke") {
      // Revoke all existing share links for this trip
      await db
        .delete(sharedTrips)
        .where(eq(sharedTrips.tripId, params.id));

      return Response.json({
        success: true,
        message: "All share links revoked",
      });

    } else if (action === "update") {
      // Update existing share settings
      if (!settings) {
        return Response.json(
          { error: "Settings required for update action" },
          { status: 400 }
        );
      }

      const expiresAt = settings.expiresAt ? new Date(settings.expiresAt) : null;

      await db
        .update(sharedTrips)
        .set({
          isPublic: settings.isPublic,
          allowComments: settings.allowComments,
          permissions: settings.permissions,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(sharedTrips.tripId, params.id));

      return Response.json({
        success: true,
        message: "Share settings updated",
        settings: {
          isPublic: settings.isPublic,
          allowComments: settings.allowComments,
          permissions: settings.permissions,
          expiresAt: expiresAt?.toISOString() || null,
        },
      });
    }

    return Response.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Share endpoint error:", error);
    
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify trip ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, params.id), eq(trips.userId, userId)))
      .limit(1);

    if (!trip.length) {
      return new Response("Trip not found", { status: 404 });
    }

    // Get existing share settings
    const existingShares = await db
      .select()
      .from(sharedTrips)
      .where(eq(sharedTrips.tripId, params.id));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const shares = existingShares.map(share => ({
      id: share.id,
      shareUrl: `${baseUrl}/shared/${share.id}`,
      isPublic: share.isPublic,
      allowComments: share.allowComments,
      permissions: share.permissions,
      expiresAt: share.expiresAt?.toISOString() || null,
      createdAt: share.createdAt.toISOString(),
      updatedAt: share.updatedAt?.toISOString() || null,
    }));

    return Response.json({
      success: true,
      shares,
    });

  } catch (error) {
    console.error("Get share settings error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}