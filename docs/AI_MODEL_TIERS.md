# AI Model Tier System

## Overview

Tripthesia uses a tier-based AI model system to optimize costs while maintaining quality. Different subscription tiers use different AI models with automatic fallback mechanisms.

## Model Tiers

### Free Tier
- **Model**: GPT-4o-mini (OpenAI)
- **Cost**: $0.15/1M input tokens, $0.60/1M output tokens
- **Estimated cost per trip**: ~$0.019
- **Use case**: Free users, cost-optimized experience
- **Quality**: 90% of Claude quality with excellent tool calling

### Pro Tier  
- **Model**: Claude 3.5 Sonnet (Anthropic)
- **Cost**: $3.00/1M input tokens, $15.00/1M output tokens
- **Estimated cost per trip**: ~$0.075
- **Use case**: Paying subscribers, premium experience
- **Quality**: Highest quality reasoning and tool calling

### Enterprise Tier
- **Model**: Claude 3.5 Sonnet (Anthropic)
- **Cost**: Same as Pro tier
- **Configuration**: Higher token limits, lower temperature
- **Use case**: Enterprise customers with advanced needs

## Cost Comparison

For a typical trip generation (10,000 input + 3,000 output tokens):

| Tier | Cost per Trip | Cost per 1,000 Users/Month |
|------|---------------|----------------------------|
| Free | $0.019 | $95 |
| Pro | $0.075 | $375 |
| **Savings** | **4x cheaper** | **4x cost reduction** |

## Implementation

### Automatic Tier Selection

```typescript
import { AgentFactory, TestAgent } from "@tripthesia/agents";
import { getUserSubscriptionTier } from "@/lib/subscription";

// Get user's subscription tier
const userTier = await getUserSubscriptionTier(userId);

// Create agent with appropriate model
const agent = await AgentFactory.createAgent(TestAgent, userTier);

// Use agent normally - tier is handled automatically
const result = await agent.generateText("Plan a trip to Paris");
```

### Model Configuration

Models are configured in `packages/agents/src/base-agent.ts`:

```typescript
export const MODEL_TIERS: Record<string, ModelTierConfig> = {
  free: {
    provider: "openai",
    model: "gpt-4o-mini",
    costPerInputToken: 0.15,
    costPerOutputToken: 0.60,
    maxTokens: 4096,
    temperature: 0.1,
  },
  pro: {
    provider: "anthropic", 
    model: "claude-3-5-sonnet-20240620",
    costPerInputToken: 3.0,
    costPerOutputToken: 15.0,
    maxTokens: 4096,
    temperature: 0.1,
  },
};
```

### Fallback Logic

The system includes automatic fallback:

1. Primary model fails → Try fallback tier
2. If no fallback configured → Return error
3. Free tier has no fallback (cost-optimized)
4. Pro/Enterprise can fallback to free tier

## Provider Integration

### OpenAI Integration (Free Tier)
- Uses OpenAI GPT-4o-mini
- Tool calling via OpenAI functions API
- Structured output with JSON mode
- Rate limiting and error handling

### Anthropic Integration (Pro/Enterprise)
- Uses Claude 3.5 Sonnet
- Tool calling via Anthropic tools API
- Advanced reasoning capabilities
- Premium experience for paying users

## Usage Limits

### Free Tier Limits
- 3 AI generations per day
- 5 trips per month
- Basic features only

### Pro Tier Limits  
- 50 AI generations per hour
- 100 trips per month
- All advanced features

### Enterprise Tier Limits
- 500 AI generations per hour
- 1,000 trips per month
- Custom features and support

## Monitoring & Metrics

### Cost Tracking
Each agent tracks:
- Total API calls
- Token usage (input/output)
- Actual costs based on model tier
- Provider performance metrics

### Quality Metrics
Monitor:
- Tool calling success rate
- Response quality scores
- User satisfaction ratings
- Generation speed

## Testing

Use the test API endpoint to validate model performance:

```bash
# Test free tier model
curl -X POST /api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Plan a day in Tokyo", "forceModel": "free"}'

# Test pro tier model  
curl -X POST /api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Plan a day in Tokyo", "forceModel": "pro"}'
```

## Migration Plan

### Phase 1: Free Tier Migration (Immediate)
1. Deploy new BaseAgent with OpenAI support
2. Switch free tier users to GPT-4o-mini
3. Monitor quality and cost metrics
4. Achieve 4x cost reduction

### Phase 2: Optimization (Week 2)
1. Fine-tune prompts for GPT-4o-mini
2. A/B test quality vs cost
3. Optimize tool calling reliability
4. Monitor user satisfaction

### Phase 3: Advanced Features (Month 2)
1. Add self-hosted Llama 3.1 fallback
2. Experiment with Chinese models
3. Implement smart model routing
4. Add cost optimization algorithms

## Environment Configuration

Add to `.env.local`:

```bash
# Required for both tiers
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-openai-key

# Optional: For fallback testing
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Best Practices

### For Free Tier Users
- Optimize prompts for GPT-4o-mini
- Use structured output for consistent results
- Implement retry logic for tool calling
- Monitor quality metrics closely

### For Pro Tier Users
- Leverage Claude's advanced reasoning
- Use complex tool combinations
- Provide premium UX with faster generation
- Maintain quality expectations

### Development
- Always test with both tiers
- Monitor cost metrics in development
- Use rate limiting to prevent cost spikes
- Implement graceful fallbacks

## Future Enhancements

1. **Self-hosted Models**: Add Llama 3.1 70B for near-zero marginal cost
2. **Smart Routing**: Route simple queries to cheaper models
3. **Quality Optimization**: Fine-tune models for travel domain
4. **Cost Predictions**: Predict and optimize costs before generation
5. **A/B Testing**: Continuous quality vs cost optimization