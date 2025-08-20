import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { getUserSubscriptionTier, canUseAIFeature, incrementAIUsage } from "@/lib/subscription";
// Temporarily disabled for deployment
// import { AgentFactory, TestAgent } from "@tripthesia/agents";

export async function POST() {
  return Response.json({ error: 'AI features temporarily unavailable during deployment' }, { status: 503 });
}

export async function GET() {
  return Response.json({ error: 'AI features temporarily unavailable during deployment' }, { status: 503 });
}

/*
import { withRateLimit, RateLimitError } from "@/lib/rate-limit";

const testAISchema = z.object({
  prompt: z.string().min(1).max(500),
  testType: z.enum(["simple", "structured"]).default("simple"),
  forceModel: z.enum(["free", "pro", "enterprise"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    return await withRateLimit(
      req,
      async () => {
        const { userId } = auth();
        
        const body = await req.json();
        const { prompt, testType, forceModel } = testAISchema.parse(body);

        // Check if user can use AI features
        const aiAccess = await canUseAIFeature(userId);
        if (!aiAccess.canUse) {
          return NextResponse.json(
            { 
              error: "AI feature access denied",
              reason: aiAccess.reason,
              tier: aiAccess.tier,
            },
            { status: 403 }
          );
        }

        // Determine model tier (allow override for testing)
        const userTier = forceModel || aiAccess.tier;
        
        // Create agent with appropriate tier
        const agent = await AgentFactory.createAgent(TestAgent, userTier);
        
        const startTime = Date.now();
        let result: any;
        
        try {
          if (testType === "structured") {
            // Test structured output
            const structuredPrompt = `${prompt}\n\nRespond with JSON in this format: {"message": "your response", "confidence": 0.95}`;
            const schema = z.object({
              message: z.string(),
              confidence: z.number(),
            });
            
            result = await agent.generateStructuredData(structuredPrompt, schema);
          } else {
            // Test simple text generation
            result = { message: await agent.generateText(prompt) };
          }
          
          const endTime = Date.now();
          const latency = endTime - startTime;
          
          // Get metrics
          const metrics = agent.getMetrics();
          
          // Increment usage counter for non-pro users
          if (aiAccess.tier === "free") {
            await incrementAIUsage(userId);
          }
          
          // Get cost comparison across all tiers for analysis
          const costComparison = AgentFactory.compareCosts(
            Math.round(metrics.totalTokens * 0.7), // Rough input estimate
            Math.round(metrics.totalTokens * 0.3)  // Rough output estimate
          );
          
          return NextResponse.json({
            success: true,
            result,
            metadata: {
              userTier: aiAccess.tier,
              modelUsed: userTier,
              provider: metrics.provider,
              model: metrics.model,
              latency: `${latency}ms`,
              tokens: metrics.totalTokens,
              cost: `$${metrics.totalCost.toFixed(6)}`,
              costComparison,
            },
          });
          
        } catch (aiError) {
          console.error("AI generation failed:", aiError);
          return NextResponse.json(
            { 
              error: "AI generation failed",
              details: aiError instanceof Error ? aiError.message : "Unknown error",
              userTier: aiAccess.tier,
              modelAttempted: userTier,
            },
            { status: 500 }
          );
        }
      },
      {
        userLimit: "AI_GENERATION_FREE",
        ipLimit: "API_PER_MINUTE",
      }
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: error.message },
        { status: 429 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("AI test endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    // Get user's subscription info
    const userTier = await getUserSubscriptionTier(userId);
    const aiAccess = await canUseAIFeature(userId);
    
    // Get model configurations
    const modelConfigs = Object.entries(AgentFactory.compareCosts(1000, 300)).map(
      ([tier, info]) => ({
        tier,
        ...info,
        available: tier === userTier || tier === "free",
      })
    );
    
    return NextResponse.json({
      user: {
        id: userId || "anonymous",
        tier: userTier,
        canUseAI: aiAccess.canUse,
        reason: aiAccess.reason,
      },
      models: modelConfigs,
      costSavings: {
        freeVsPro: {
          savings: `${((modelConfigs.find(m => m.tier === "pro")?.cost || 0) / (modelConfigs.find(m => m.tier === "free")?.cost || 1) * 100 - 100).toFixed(0)}%`,
          description: "Cost increase when using Pro tier vs Free tier",
        },
      },
    });
  } catch (error) {
    console.error("AI info endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to get AI info" },
      { status: 500 }
    );
  }
}
*/