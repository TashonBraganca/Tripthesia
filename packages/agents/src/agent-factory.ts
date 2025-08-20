import { BaseAgent, AgentConfig, MODEL_TIERS, type SubscriptionTier } from "./base-agent";

export class AgentFactory {
  static async createAgent<T extends BaseAgent>(
    AgentClass: new (config: Partial<AgentConfig>) => T,
    userTier: SubscriptionTier,
    options: Partial<AgentConfig> = {}
  ): Promise<T> {
    // Validate that the tier exists
    if (!MODEL_TIERS[userTier]) {
      console.warn(`Invalid subscription tier: ${userTier}, defaulting to free`);
      userTier = "free";
    }

    const config: Partial<AgentConfig> = {
      tier: userTier,
      fallbackTier: userTier === "pro" || userTier === "enterprise" ? "free" : undefined,
      ...options,
    };

    return new AgentClass(config);
  }

  static getModelInfo(tier: SubscriptionTier) {
    const modelConfig = MODEL_TIERS[tier];
    if (!modelConfig) {
      return MODEL_TIERS.free;
    }
    return modelConfig;
  }

  static getCostEstimate(tier: SubscriptionTier, inputTokens: number, outputTokens: number): number {
    const modelConfig = this.getModelInfo(tier);
    const inputCost = (inputTokens / 1000000) * modelConfig.costPerInputToken;
    const outputCost = (outputTokens / 1000000) * modelConfig.costPerOutputToken;
    return inputCost + outputCost;
  }

  static compareCosts(
    inputTokens: number, 
    outputTokens: number
  ): Record<SubscriptionTier, { cost: number; model: string; provider: string }> {
    const result: any = {};
    
    for (const [tier, config] of Object.entries(MODEL_TIERS)) {
      result[tier] = {
        cost: this.getCostEstimate(tier as SubscriptionTier, inputTokens, outputTokens),
        model: config.model,
        provider: config.provider,
      };
    }
    
    return result;
  }
}

// Example usage with a concrete agent class
export class TestAgent extends BaseAgent {
  async generateText(prompt: string): Promise<string> {
    const messages = [{ role: "user", content: prompt }];
    return this.callAI<string>(messages);
  }

  async generateStructuredData<T>(
    prompt: string, 
    schema: any
  ): Promise<T> {
    const messages = [{ role: "user", content: prompt }];
    return this.callAI<T>(messages, undefined, schema);
  }

  getName(): string {
    return "TestAgent";
  }
}

export { type SubscriptionTier } from "./base-agent";