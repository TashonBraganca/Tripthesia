# AI Agent Documentation

## Overview
Tripthesia uses Claude Sonnet as the primary AI model with a tool-first approach to generate, edit, and optimize travel itineraries. The AI system is designed for accuracy, cost-efficiency, and reliability.

## Agent Architecture

### Core Agents

#### Planner Agent
**Purpose**: Generate complete multi-day itineraries
**Model**: Claude Sonnet 3.5
**Process Flow**:
1. **Input Normalization**: Parse user requirements and constraints
2. **Candidate Fetching**: Use tools to gather place options
3. **Scoring & Filtering**: Rank places by relevance, reviews, and user preferences
4. **Day Packing**: Optimize daily schedules with time windows and travel time
5. **Output Generation**: Structured JSON with booking links and metadata

**Tools Used**:
- Places search (Foursquare + OpenTripMap)
- Route calculation (OpenRouteService)
- Weather checking (Open-Meteo)
- Price lookup (multiple providers)
- Hours validation (cached data)

#### Reflow Agent
**Purpose**: Update itineraries while respecting user locks
**Model**: Claude Sonnet 3.5
**Process Flow**:
1. **Constraint Analysis**: Identify locked items and user modifications
2. **Impact Assessment**: Determine which parts of itinerary need updating
3. **Minimal Recomputation**: Only regenerate affected segments
4. **Validation**: Ensure time/budget constraints are met
5. **Output**: Updated itinerary with change annotations

**Constraint Solver Heuristic**:
- Preserve locked activities at all costs
- Minimize travel time between activities
- Respect opening hours and availability
- Stay within budget allocations
- Maintain trip pace preferences

#### Reroute Agent
**Purpose**: Same-day adjustments for weather/closures
**Model**: Claude Sonnet 3.5 (or Claude Haiku for speed)
**Process Flow**:
1. **Current State Analysis**: What's already done today
2. **Disruption Assessment**: Weather, closures, delays
3. **Alternative Generation**: Find replacement activities
4. **Time Optimization**: Reorder remaining activities
5. **Output**: Updated day plan with explanations

## Tool System

### Places Tool (tools/places.ts)
**Purpose**: Search and categorize points of interest
**Data Sources**:
- **Primary**: Foursquare Places API
- **Secondary**: OpenTripMap
- **Fallback**: Google Places (display only on Google Maps)

**Output Schema**:
```typescript
interface Place {
  id: string;           // fsq:xxx or otm:xxx
  name: string;
  category: string;     // Normalized category
  rating: number;       // 0-5 scale
  coords: [lng, lat];
  hours?: OpeningHours;
  source: "fsq" | "otm" | "google";
  booking?: BookingInfo;
}
```

**Categorization Mapping**:
- Foursquare → Standard categories
- OpenTripMap → Mapped to Foursquare equivalents
- Deduplication by location + name similarity

### Hours Tool (tools/hours.ts)
**Purpose**: Parse and validate opening hours
**Features**:
- Parse complex hour formats
- Handle holiday exceptions
- Cache with 7-day TTL
- Timezone awareness

**Schema**:
```typescript
interface OpeningHours {
  open: [number, number][];  // Minutes from midnight
  timezone: string;
  exceptions?: {
    date: string;
    hours?: [number, number][];
    closed?: boolean;
  }[];
}
```

### Route Tool (tools/route.ts)
**Purpose**: Calculate travel times and distances
**Provider**: OpenRouteService
**Profiles**: walking, driving-car, cycling-regular, public-transport

**Features**:
- Matrix calculations for efficiency
- Traffic-aware routing
- Multimodal transport
- Accessibility considerations

### Prices Tool (tools/prices.ts)
**Purpose**: Aggregate pricing from multiple sources
**Providers**:
- **Flights**: Kiwi Tequila
- **Hotels**: Booking.com/Agoda (affiliate links)
- **Activities**: GetYourGuide, Viator, Klook
- **Cars**: DiscoverCars/Rentalcars

**Output Schema**:
```typescript
interface PriceQuote {
  itemType: "flight" | "hotel" | "activity" | "car";
  amount: number;
  currency: string;
  url: string;         // Deep link
  provider: string;
  expiresAt: Date;
  confidence: "high" | "medium" | "low";
}
```

### Weather Tool (tools/weather.ts)
**Purpose**: Get weather forecasts and alerts
**Provider**: Open-Meteo
**Features**:
- 14-day forecasts
- Hourly data
- Weather alerts
- UV index, precipitation

### Currency Tool (tools/currency.ts)
**Purpose**: Convert between currencies
**Provider**: Open Exchange Rates
**Features**:
- Real-time rates
- Historical data
- 180+ currencies
- Smart rounding

## JSON Schemas (Zod)

### Core Data Structures

#### PlaceRef Schema
```typescript
const PlaceRef = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  lat: z.number(),
  lng: z.number(),
  source: z.enum(["fsq", "otm", "google"]),
  hours: z.object({
    open: z.array(z.tuple([z.number(), z.number()]))
  }).optional(),
});
```

#### ActivityItem Schema
```typescript
const ActivityItem = z.object({
  id: z.string(),
  place: PlaceRef,
  start: z.string(),    // ISO datetime
  end: z.string(),      // ISO datetime
  kind: z.enum(["sight", "food", "bar", "nature", "business", "lodging", "transfer"]),
  locked: z.boolean().default(false),
  priceEstimate: z.number().nullable(),
  booking: z.object({
    url: z.string().url().optional(),
    source: z.string().optional()
  }).optional(),
});
```

#### Itinerary Schema
```typescript
const Itinerary = z.object({
  tripId: z.string(),
  days: z.array(DayPlan),
  summary: z.string(),
  currency: z.string().default("USD"),
  totalBudget: z.number().optional(),
  confidence: z.number(),    // 0-1 score
});
```

## AI Policies & Guidelines

### Data Accuracy Policy
- **Never invent data**: All hours, prices, and details must come from tools
- **Source attribution**: Every piece of information includes its source
- **Confidence flags**: Mark uncertain data appropriately
- **Validation**: Cross-check critical information when possible

### Cost Management
- **Token Budget**: Target ≤ $0.05 per full itinerary
- **Model Selection**: 
  - Sonnet 3.5 for complex planning
  - Haiku for simple updates/routing
- **Tool Optimization**: Batch API calls when possible
- **Caching**: Aggressive caching of tool results

### Quality Assurance
- **Output Validation**: All outputs pass through Zod parsing
- **Error Handling**: Graceful fallbacks for tool failures
- **Logging**: Comprehensive logging for debugging
- **Testing**: Unit tests for all tools and agents

## Prompt Engineering

### System Prompt Templates
- **Planning Context**: Trip type, preferences, constraints
- **Tool Usage**: When and how to use each tool
- **Output Format**: Strict JSON schema requirements
- **Error Handling**: What to do when tools fail

### Few-Shot Examples
Trip types with example inputs/outputs:
- **Business Trip**: Efficiency-focused, near hotels/offices
- **Adventure Trek**: Outdoor activities, flexible timing
- **Cultural Research**: Museums, historical sites, guided tours
- **Mixed Leisure**: Balanced variety, popular attractions

### Chain-of-Thought Reasoning
1. **Understand Requirements**: Parse user input
2. **Gather Information**: Use tools systematically
3. **Apply Constraints**: Time, budget, preferences
4. **Optimize Schedule**: Minimize travel, maximize value
5. **Validate Output**: Check for errors/conflicts

## Error Handling & Fallbacks

### Tool Failure Handling
- **Places**: Foursquare → OpenTripMap → Cached popular spots
- **Routing**: OpenRouteService → Heuristic estimates
- **Pricing**: Primary provider → Secondary → "Contact for pricing"
- **Weather**: Open-Meteo → Historical averages

### LLM Parse Errors
- **Detection**: Zod validation failure
- **Recovery**: Retry with corrected prompt
- **Reporting**: Log to Sentry with context
- **Fallback**: Return structured error to client

### Rate Limiting
- **Circuit Breakers**: Stop calling failing APIs
- **Backoff Strategy**: Exponential backoff with jitter
- **Degraded Service**: Still provide basic functionality
- **User Communication**: Clear error messages

## Performance Monitoring

### Agent Metrics
- Generation time per itinerary
- Tool call success rates
- Token usage per request
- Error rates by tool/model

### Cost Tracking (cost.ts)
- Token usage by model
- API call costs by provider
- Total cost per itinerary
- Budget alerts and limits

### Quality Metrics
- User satisfaction ratings
- Itinerary completion rates
- Edit frequency (indicates quality)
- Booking conversion rates

## Future Enhancements

### Advanced Features (Roadmap)
- **Multi-agent collaboration**: Specialized agents for different domains
- **Learning from feedback**: Improve suggestions based on user behavior
- **Real-time adaptation**: Dynamic replanning during trips
- **Collaborative planning**: Multi-user trip planning

### Model Improvements
- **Fine-tuning**: Domain-specific model training
- **Retrieval-Augmented Generation**: Enhanced knowledge base
- **Multi-modal inputs**: Image recognition for landmarks
- **Voice integration**: Natural language trip planning