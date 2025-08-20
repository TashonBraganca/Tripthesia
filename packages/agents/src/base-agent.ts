import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z, ZodSchema } from "zod";

export interface AgentMetrics {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
  provider: string;
  model: string;
}

export interface ModelTierConfig {
  provider: "anthropic" | "openai";
  model: string;
  costPerInputToken: number;  // Cost per 1M input tokens
  costPerOutputToken: number; // Cost per 1M output tokens
  maxTokens: number;
  temperature: number;
}

export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface AgentConfig {
  tier: SubscriptionTier;
  timeout: number;
  fallbackTier?: SubscriptionTier;
}

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public cause?: Error
  ) {
    super(message);
    this.name = "AgentError";
  }
}

// Model tier configurations - All using GPT-4o-mini for optimal cost/performance
export const MODEL_TIERS: Record<SubscriptionTier, ModelTierConfig> = {
  free: {
    provider: "openai",
    model: "gpt-4o-mini",
    costPerInputToken: 0.15, // $0.15/1M tokens
    costPerOutputToken: 0.60, // $0.60/1M tokens
    maxTokens: 2048, // Lower limit for free tier
    temperature: 0.1,
  },
  pro: {
    provider: "openai",
    model: "gpt-4o-mini", // 96% cost savings vs Claude Sonnet!
    costPerInputToken: 0.15, // $0.15/1M tokens (was $3.00)
    costPerOutputToken: 0.60, // $0.60/1M tokens (was $15.00)
    maxTokens: 4096, // Higher limit for pro tier
    temperature: 0.1,
  },
  enterprise: {
    provider: "openai",
    model: "gpt-4o-mini", // Consistent model across all tiers
    costPerInputToken: 0.15, // $0.15/1M tokens
    costPerOutputToken: 0.60, // $0.60/1M tokens
    maxTokens: 8192, // Highest limit for enterprise
    temperature: 0.05, // More deterministic for enterprise
  },
};

export abstract class BaseAgent {
  protected anthropic: Anthropic;
  protected openai: OpenAI;
  protected config: AgentConfig;
  protected modelConfig: ModelTierConfig;
  protected metrics: AgentMetrics;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      tier: "free", // Default to free tier (more cost-effective)
      timeout: 30000,
      ...config,
    };

    this.modelConfig = MODEL_TIERS[this.config.tier];
    
    // Initialize OpenAI client (primary)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Anthropic client (optional fallback)
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "dummy-key",
    });

    this.metrics = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      errorRate: 0,
      provider: this.modelConfig.provider,
      model: this.modelConfig.model,
    };
  }

  protected async executeWithMetrics<T>(
    operation: () => Promise<T>,
    operation_name: string
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalCalls++;

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new AgentError("Operation timeout", "TIMEOUT")),
            this.config.timeout
          )
        ),
      ]);

      const latency = Date.now() - startTime;
      this.updateLatencyMetrics(latency);
      
      return result;
    } catch (error) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.totalCalls - 1) + 1) / this.metrics.totalCalls;

      if (error instanceof AgentError) {
        throw error;
      }

      throw new AgentError(
        `${operation_name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        "EXECUTION_ERROR",
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  protected async callAI<T>(
    messages: Array<{ role: string; content: string }>,
    tools?: any[],
    responseSchema?: ZodSchema<T>,
    retryWithFallback = true
  ): Promise<T> {
    return this.executeWithMetrics(async () => {
      try {
        // Always try OpenAI first (all tiers now use OpenAI)
        return await this.callOpenAIAPI(messages, tools, responseSchema);
      } catch (error) {
        // Optional fallback to Anthropic if OpenAI fails and API key is available
        if (retryWithFallback && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "dummy-key") {
          console.warn(`OpenAI failed, trying Anthropic fallback:`, error instanceof Error ? error.message : error);
          try {
            return await this.callAnthropicAPI(messages, tools, responseSchema);
          } catch (fallbackError) {
            console.error(`Anthropic fallback also failed:`, fallbackError instanceof Error ? fallbackError.message : fallbackError);
            throw error; // Throw original OpenAI error
          }
        }
        throw error;
      }
    }, `${this.modelConfig.provider}_call`);
  }

  private async callAnthropicAPI<T>(
    messages: Array<{ role: string; content: string }>,
    tools?: any[],
    responseSchema?: ZodSchema<T>
  ): Promise<T> {
    // Convert generic messages to Anthropic format
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const response = await this.anthropic.messages.create({
      model: this.modelConfig.model,
      max_tokens: this.modelConfig.maxTokens,
      temperature: this.modelConfig.temperature,
      messages: anthropicMessages,
      tools: tools as Anthropic.Messages.Tool[],
    });

    // Update token metrics
    this.updateTokenMetrics(response.usage.input_tokens, response.usage.output_tokens);

    // Extract content
    const content = response.content[0];
    if (content.type !== "text") {
      throw new AgentError("Expected text response", "INVALID_RESPONSE");
    }

    return this.parseResponse(content.text, responseSchema);
  }

  private async callOpenAIAPI<T>(
    messages: Array<{ role: string; content: string }>,
    tools?: any[],
    responseSchema?: ZodSchema<T>
  ): Promise<T> {
    // Convert generic messages to OpenAI format
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.modelConfig.model,
      messages: openaiMessages,
      max_tokens: this.modelConfig.maxTokens,
      temperature: this.modelConfig.temperature,
    };

    // Use structured outputs if schema is provided (GPT-4o-mini's strength!)
    if (responseSchema && !tools) {
      // Convert Zod schema to JSON schema for structured outputs
      const jsonSchema = this.zodToJsonSchema(responseSchema);
      params.response_format = {
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          schema: jsonSchema,
          strict: true,
        },
      };
    }

    // Add tools if provided
    if (tools && tools.length > 0) {
      params.tools = tools.map(tool => ({
        type: "function" as const,
        function: tool,
      }));
      params.tool_choice = "auto";
    }

    const response = await this.openai.chat.completions.create(params);

    // Update token metrics
    if (response.usage) {
      this.updateTokenMetrics(response.usage.prompt_tokens, response.usage.completion_tokens);
    }

    // Handle tool calls
    const message = response.choices[0]?.message;
    if (message?.tool_calls && message.tool_calls.length > 0) {
      // For now, return the first tool call result
      const toolCall = message.tool_calls[0];
      if (toolCall.function.arguments) {
        const toolResult = JSON.parse(toolCall.function.arguments);
        return responseSchema ? responseSchema.parse(toolResult) : toolResult;
      }
    }

    // Extract regular content
    const content = message?.content;
    if (!content) {
      throw new AgentError("No response content", "INVALID_RESPONSE");
    }

    return this.parseResponse(content, responseSchema);
  }

  private parseResponse<T>(content: string, responseSchema?: ZodSchema<T>): T {
    if (responseSchema) {
      try {
        const parsed = JSON.parse(content);
        return responseSchema.parse(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new AgentError(
            "Response validation failed",
            "VALIDATION_ERROR",
            undefined,
            error
          );
        }
        throw new AgentError(
          "Failed to parse response JSON",
          "PARSE_ERROR",
          undefined,
          error instanceof Error ? error : undefined
        );
      }
    }
    return content as T;
  }

  private zodToJsonSchema(schema: ZodSchema): any {
    // Simple Zod to JSON Schema conversion
    // For production, consider using zod-to-json-schema library
    try {
      const { zodToJsonSchema } = require("zod-to-json-schema");
      return zodToJsonSchema(schema);
    } catch (error) {
      // Fallback: return a basic schema structure
      console.warn("zod-to-json-schema not available, using basic schema");
      return {
        type: "object",
        additionalProperties: true,
      };
    }
  }

  protected validateInput<T>(data: unknown, schema: ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AgentError(
          `Input validation failed: ${error.errors.map(e => e.message).join(", ")}`,
          "VALIDATION_ERROR",
          400,
          error
        );
      }
      throw error;
    }
  }

  private updateTokenMetrics(inputTokens: number, outputTokens: number): void {
    const totalTokens = inputTokens + outputTokens;
    this.metrics.totalTokens += totalTokens;

    // Calculate cost based on current model tier
    const inputCost = (inputTokens / 1000000) * this.modelConfig.costPerInputToken;
    const outputCost = (outputTokens / 1000000) * this.modelConfig.costPerOutputToken;
    this.metrics.totalCost += inputCost + outputCost;
  }

  private updateLatencyMetrics(latency: number): void {
    const previousTotal = this.metrics.averageLatency * (this.metrics.totalCalls - 1);
    this.metrics.averageLatency = (previousTotal + latency) / this.metrics.totalCalls;
  }

  public getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      errorRate: 0,
      provider: this.modelConfig.provider,
      model: this.modelConfig.model,
    };
  }

  abstract getName(): string;
}