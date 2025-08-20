# CLAUDE.md - Development Reference for Tripthesia

## Project Overview
AI-first global travel planner with real pricing, availability, and booking links. Production-ready platform serving international travelers with advanced trip planning capabilities.

## Key Commands
```bash
# Development
pnpm dev                    # Start dev server
pnpm lint                   # Run linting  
pnpm typecheck             # TypeScript check
pnpm build                 # Production build
pnpm test                  # Run tests

# Database
pnpm db:generate           # Generate migrations
pnpm db:migrate            # Run migrations
pnpm db:seed              # Seed database

# Format
pnpm format               # Format code (Prettier width 80)
```

## Architecture Quick Reference

### Tech Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes, Drizzle ORM, Neon PostgreSQL + PostGIS
- **AI**: GPT-4o-mini (primary) + Claude Sonnet (premium), Zod validation
- **Auth**: Clerk (email/password + social)
- **Payments**: Multi-gateway (Stripe primary, PayPal backup, Razorpay regional)
- **Cache**: Redis with intelligent multi-layer caching
- **Maps**: Mapbox GL JS, OpenRouteService
- **Monitoring**: Sentry, PostHog

### Key Integrations
- **Places**: Foursquare Places, OpenTripMap
- **Flights**: Kiwi Tequila (deep links)
- **Hotels**: Booking.com/Agoda affiliate links
- **Activities**: GetYourGuide, Viator, Klook
- **Weather**: Open-Meteo
- **Currency**: Real-time exchange rates

### Project Structure
```
apps/web/                 # Next.js app
├── app/                  # App Router pages & API
├── components/           # UI components  
├── lib/                  # Utilities (auth, db, etc.)
└── providers/            # React providers

packages/
├── agents/               # AI orchestration & tools
├── ui/                   # Shared UI components
└── config/               # Shared configs

infra/                    # Database schema & migrations
docs/                     # Documentation
```

### Database Schema (Key Tables)
- `users` - Clerk user data
- `profiles` - User preferences, subscription status
- `trips` - Trip metadata, destinations, dates
- `itineraries` - Generated trip plans (JSON)
- `places` - Cached POI data with PostGIS coords
- `price_quotes` - Cached pricing data

### API Endpoints Structure
- `POST /api/trips` - Create trip from wizard
- `POST /api/trips/:id/generate` - Stream itinerary generation  
- `POST /api/trips/:id/reflow` - Lock-aware plan updates
- `GET /api/search/places` - POI search
- `GET /api/price/*` - Flight/hotel/activity pricing
- `POST /api/export/:id` - PDF/ICS export
- `POST /api/webhooks/*` - Payment gateway webhooks

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode, noImplicitAny
- **Prettier**: Print width 80, standard config  
- **ESLint**: Strict rules
- **Zod**: All API inputs/outputs validated
- **Error Handling**: Consistent HTTP status codes

### AI Agent Architecture
- **Planner**: Generate full itineraries with constraints
- **Reflow**: Update plans respecting user locks
- **Reroute**: Same-day adjustments for weather/closures
- **Tools**: Places search, routing, pricing, weather
- **Validation**: Strict Zod schemas, never invent data

### Caching Strategy
- **Places**: 24h cache per bbox+category
- **Hours**: 7 day cache per place
- **Prices**: 2-4h cache per trip+item
- **Redis keys**: `place:{bbox}:{cat}`, `hours:{placeId}`, `price:{tripId}:{itemKey}`

### Security & Compliance
- No data scraping, respect partner TOS
- Encrypt secrets, GDPR-ready
- Display Google Places only on Google maps
- Row Level Security with Clerk userId

## Global Subscription Tiers

### Free Tier (Global Launch Tier)
- **Price**: $0/month
- **Trips**: 2 per month
- **Features**: Basic AI planning, PDF/ICS export, standard support
- **Target**: Users trying the platform

### Pro Tier (Individual Travelers)
- **Price**: $8/month (USD primary, multi-currency support)
- **Trips**: 10 per month
- **Features**: Advanced AI, real-time pricing, priority support, collaboration
- **Target**: Regular travelers and trip planning enthusiasts

### Enterprise Tier (Teams & Power Users)
- **Price**: $15/month (USD primary, multi-currency support)
- **Trips**: Unlimited
- **Features**: Premium AI models, API access, team features, dedicated support
- **Target**: Travel agencies, corporate users, power planners

## Global Payment Strategy

### Primary Gateway: Stripe
- **Regions**: US, EU, CA, AU, UK, SG, JP
- **Currencies**: USD, EUR, GBP, CAD, AUD, SGD, JPY
- **Features**: Full subscription management, global coverage

### Backup Gateway: PayPal
- **Regions**: Global coverage
- **Currencies**: USD, EUR, GBP, CAD, AUD
- **Features**: International backup, familiar brand

### Regional Gateway: Razorpay (India)
- **Regions**: India
- **Currencies**: INR
- **Features**: UPI, Net Banking, local payment methods
- **Pricing**: ₹665/month (Pro), ₹1,250/month (Enterprise)

## International Features

### Multi-Currency Support
- **Primary**: USD for global pricing
- **Regional**: EUR, GBP, CAD, AUD, INR, SGD, JPY
- **Display**: Auto-detect user location, allow manual override
- **Conversion**: Real-time exchange rates

### Global Coverage
- **Destinations**: 200+ countries and territories
- **Languages**: English (primary), framework for expansion
- **Compliance**: GDPR, CCPA, regional privacy laws
- **Payments**: Local payment methods per region

## Brand Guidelines
- **Voice**: Sophisticated, adventurous, globally accessible
- **Colors**: Emerald primary, Sky secondary, Amber accent, Zinc neutrals
- **Typography**: Inter + JetBrains Mono
- **Theme**: Dark mode default with global accessibility
- **Copy**: Professional, inclusive, culturally aware

## Environment Variables Required
```bash
# Core
NEXT_PUBLIC_APP_URL=https://tripthesia.com
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Auth
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY= 

# Payments - Multi-Gateway
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_PRO_PLAN_ID=
PAYPAL_ENTERPRISE_PLAN_ID=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PRO_PLAN_ID=
RAZORPAY_ENTERPRISE_PLAN_ID=

# AI - Cost Optimized
OPENAI_API_KEY=           # Primary (96% cost savings!)
ANTHROPIC_API_KEY=        # Premium tier fallback

# Integrations
NEXT_PUBLIC_MAPBOX_TOKEN=
KIWI_API_KEY=
FOURSQUARE_API_KEY=
OPENROUTESERVICE_API_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

## Common Development Patterns

### API Route Pattern
```ts
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const schema = z.object({
  // validation
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    const body = await req.json();
    const data = schema.parse(body);
    
    // logic
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Message' }, { status: 400 });
  }
}
```

### Global Payment Pattern
```ts
import { 
  getBestPaymentGateway, 
  createStripeCheckoutSession,
  createPayPalSubscription,
  createRazorpaySubscription,
  formatAmount,
  getTierPrice
} from '@/lib/payment-gateways';

export async function createSubscription(
  userId: string, 
  tier: SubscriptionTier,
  userCountry?: string,
  currency?: string
) {
  const gateway = getBestPaymentGateway(userCountry, currency);
  
  switch (gateway) {
    case 'stripe':
      return createStripeCheckoutSession(userId, tier, successUrl, cancelUrl, currency);
    case 'paypal':
      return createPayPalSubscription(userId, tier, currency);
    case 'razorpay':
      return createRazorpaySubscription(userId, tier);
    default:
      throw new Error('No payment gateway available');
  }
}
```

### Component Pattern  
```tsx
import { cn } from '@/lib/utils';
import { formatAmount, getTierPrice } from '@/lib/payment-gateways';

interface ComponentProps {
  tier: SubscriptionTier;
  currency?: string;
  className?: string;
}

export function PricingComponent({ tier, currency = 'USD', ...props }: ComponentProps) {
  const price = getTierPrice(tier, currency);
  const formattedPrice = formatAmount(price, currency);
  
  return (
    <div className={cn("default-classes", props.className)}>
      <span>{formattedPrice}/month</span>
    </div>
  );
}
```

## Performance Targets
- **Generation**: <10s full itinerary
- **Page Load**: <2.5s P95 on planner
- **Error Rate**: <1% on core flows
- **Cost**: <$0.05 per full itinerary (96% reduction achieved)

## Global Launch Checklist
- [x] Multi-gateway payment system implemented
- [x] Global pricing tiers configured
- [x] Multi-currency support
- [x] International compliance (GDPR/CCPA ready)
- [x] Global API endpoints working
- [x] Auth flow complete with international support
- [x] AI cost optimization (GPT-4o-mini primary)
- [x] Error monitoring active worldwide
- [x] Performance within targets globally
- [x] Security review passed
- [x] International legal/TOS compliance
- [x] ESLint configuration and all linting errors resolved
- [x] GitHub Actions CI/CD pipeline fully operational
- [x] TypeScript strict mode compliance verified
- [x] Production builds clean with zero errors

## Regional Optimization

### North America (US/CA)
- **Primary Gateway**: Stripe
- **Currency**: USD/CAD
- **Features**: Credit cards, bank transfers
- **Compliance**: CCPA, SOX

### Europe (EU/UK)
- **Primary Gateway**: Stripe
- **Currency**: EUR/GBP
- **Features**: SEPA, local payment methods
- **Compliance**: GDPR, PSD2

### Asia-Pacific (SG/AU/JP)
- **Primary Gateway**: Stripe
- **Currency**: SGD/AUD/JPY
- **Features**: Regional payment methods
- **Compliance**: Regional data laws

### India
- **Primary Gateway**: Razorpay
- **Currency**: INR
- **Features**: UPI, Net Banking, local wallets
- **Compliance**: RBI guidelines

---

**Remember**: Focus on global scalability. Perfect for international markets while maintaining regional optimization.