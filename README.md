# Tripthesia - Global Travel Planning Platform

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Global-Coverage-blue" alt="Global Coverage" />
  <img src="https://img.shields.io/badge/Multi--Currency-USD%20%7C%20EUR%20%7C%20GBP-orange" alt="Multi-Currency" />
  <img src="https://img.shields.io/badge/Platform-Next.js%2014-black" alt="Next.js 14" />
</div>

## Overview

Tripthesia is a comprehensive travel planning platform that generates personalized itineraries with real pricing, availability, and direct booking links. Built for international travelers, supporting multiple currencies and payment methods across 200+ destinations worldwide.

**Live Platform**: [tripthesia.vercel.app](https://tripthesia.vercel.app)

## Key Features

### Intelligent Planning Engine
- 10-second generation of complete multi-day itineraries
- Smart constraint handling respecting opening hours, travel times, and budgets
- Real-time adaptation for weather, closures, and user preferences
- Advanced optimization for cost-effective travel planning

### Interactive Experience
- Drag-and-drop timeline with activity locking and reordering
- Live maps with Mapbox integration and route visualization
- Real-time pricing from flights to activities with direct booking links
- Professional exports to PDF itineraries and ICS calendars

### Global Payment Support
- Multi-gateway system (Stripe primary, PayPal backup, Razorpay regional)
- Multi-currency pricing with real-time conversion
- Regional optimization for payment methods and compliance
- Flexible subscriptions with global and regional pricing

### Enterprise-Grade Infrastructure
- Production-ready with comprehensive monitoring and error handling
- GDPR/CCPA compliant with privacy-first architecture
- 99.9% uptime with intelligent caching and rate limiting
- Accessibility WCAG 2.1 AA compliant with full keyboard navigation

## Subscription Tiers

### Free (Global Launch)
- No cost worldwide access
- 2 trips per month
- Basic itinerary planning with PDF/ICS export
- Standard support

### Pro (Individual Travelers)
- $8/month (USD primary, multi-currency)
- 10 trips per month
- Advanced planning with real-time pricing
- Priority support and collaboration features

### Enterprise (Teams & Agencies)
- $15/month (USD primary, multi-currency)
- Unlimited trips
- Premium features, API access, team management
- Dedicated support and custom integrations

Regional pricing available (e.g., ₹665/month Pro in India)

## Technical Architecture

### Core Stack
- Frontend: Next.js 14 + React 18 + TypeScript + TailwindCSS
- Backend: Next.js API routes + Drizzle ORM + PostgreSQL + PostGIS
- Planning Engine: Advanced algorithms with external API integration
- Authentication: Clerk with social login support
- Caching: Redis with multi-layer intelligent caching
- Maps: Mapbox GL JS + OpenRouteService

### Global Infrastructure
- Deployment: Vercel with multi-region optimization
- Database: Neon PostgreSQL with PostGIS for global coverage
- Monitoring: Sentry (errors) + PostHog (analytics)
- CDN: Global content delivery for optimal performance

### Payment Gateways
```typescript
// Intelligent gateway selection based on user location
const gateway = getBestPaymentGateway(userCountry, currency);

// Stripe: US, EU, CA, AU, UK, SG, JP (USD, EUR, GBP, CAD, AUD, SGD, JPY)
// PayPal: Global backup (USD, EUR, GBP, CAD, AUD)
// Razorpay: India regional (INR with UPI, Net Banking, Wallets)
```

## Quick Start

### Development Setup
```bash
# Clone repository
git clone https://github.com/TashonBraganca/Tripthesia.git
cd tripthesia

# Install dependencies
pnpm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Seed with global destinations
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Configuration
```bash
# Core Infrastructure
DATABASE_URL=                    # Neon PostgreSQL with PostGIS
UPSTASH_REDIS_REST_URL=         # Redis for caching
UPSTASH_REDIS_REST_TOKEN=

# Authentication
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Planning Engine APIs
OPENAI_API_KEY=                 # Primary planning engine
ANTHROPIC_API_KEY=              # Advanced features

# Payment Gateways
STRIPE_SECRET_KEY=              # Global primary
PAYPAL_CLIENT_ID=               # International backup
RAZORPAY_KEY_ID=                # India regional

# Maps & Integrations
NEXT_PUBLIC_MAPBOX_TOKEN=
FOURSQUARE_API_KEY=
KIWI_API_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

### Production Deployment
```bash
# Build and test
pnpm build
pnpm typecheck
pnpm lint

# Deploy to Vercel
vercel --prod

# Verify deployment
curl https://your-domain.com/api/health
```

## Global Features

### Multi-Currency Support
- Automatic detection based on user location
- Manual override for preferred currency
- Real-time conversion with live exchange rates
- Regional pricing optimization for key markets

### International Compliance
- GDPR compliant for European users
- CCPA ready for California residents
- Regional data laws compliance framework
- Privacy-first architecture with user data control

### Localization Framework
- English primary with expansion framework
- Cultural awareness in travel recommendations
- Regional preferences for activities and destinations
- Local payment methods integration

## Performance Metrics

### Speed & Reliability
- Under 10 seconds full itinerary generation
- Under 2.5 seconds P95 page load time
- Less than 1% error rate on core user flows
- 99.9% uptime with intelligent failover

### Cost Optimization
- Efficient processing with optimized algorithms
- Under $0.02 per itinerary generation cost
- 90%+ cache hit rate for places and pricing
- Intelligent rate limiting to prevent abuse

### Global Scale
- 200+ countries destination coverage
- Multiple payment gateways for global reach
- Multi-region deployment for optimal performance
- 7+ currencies with automatic conversion

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm lint                   # Code linting
pnpm typecheck             # TypeScript validation
pnpm test                   # Run test suite

# Database
pnpm db:generate           # Generate migrations
pnpm db:migrate            # Run migrations
pnpm db:seed              # Seed global data

# Formatting
pnpm format               # Code formatting (80 char width)
```

## Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- Row-level security with user isolation
- GDPR compliance with data export/deletion
- Secure API design with input validation

### Payment Security
- PCI DSS compliance through payment partners
- Tokenization for secure payment storage
- Fraud protection with gateway-level security
- Regional compliance for financial regulations

## Planning Engine Architecture

### Processing Strategy
```typescript
// Primary: Optimized algorithms for fast processing
const primaryResponse = await planningEngine.generate({
  destination: userInput.destination,
  preferences: userInput.preferences,
  constraints: userInput.constraints,
  tools: [placesTool, routingTool, pricingTool],
});

// Advanced: Enhanced processing for complex requirements
const advancedResponse = await advancedEngine.process({
  complexRequirements: true,
  tools: [advancedPlanningTool],
});
```

### Smart Caching
- 24-hour place caching per geographic region
- 7-day hours caching with timezone awareness
- 2-4 hour price caching with progressive enhancement
- Intelligent invalidation based on user patterns

## Business Model

### Global Pricing Strategy
- Free tier for platform adoption (2 trips/month)
- Pro tier for regular travelers ($8/month, 10 trips)
- Enterprise tier for agencies/teams ($15/month, unlimited)
- Regional pricing for emerging markets

### Revenue Streams
- Subscription revenue from Pro/Enterprise tiers
- Affiliate commissions from booking partnerships
- API access for third-party developers
- Enterprise licensing for white-label solutions

## Contributing

We welcome contributions from the global community! Please see our Contributing Guidelines for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Follow our code standards
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

### Community Support
- GitHub Issues for bug reports and feature requests
- Discussions for community questions and ideas
- Documentation comprehensive guides and API reference

### Enterprise Support
- Dedicated support for Enterprise subscribers
- Custom integrations and white-label solutions
- SLA guarantees for business-critical deployments

---

<div align="center">
  <h3>Built for Global Travelers by Travel Technology Experts</h3>
  <p>Experience the future of intelligent travel planning</p>
  <p><strong><a href="https://tripthesia.vercel.app">Start Planning Your Next Adventure</a></strong></p>
</div>