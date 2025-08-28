# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (Next.js 14 on port 3000)
- `npm run build` - Production build (use for testing before deployment)
- `npm run build:safe` - Safe build with environment isolation
- `npm run start` - Start production server
- `npm run lint` - ESLint code checking
- `npm run typecheck` - TypeScript type checking (must pass before commits)

### Database Operations
- `npm run db:generate` - Generate Drizzle database migrations
- `npm run db:migrate` - Apply database migrations to PostgreSQL
- `npm run db:studio` - Open Drizzle Studio for database inspection

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL via Neon with Drizzle ORM
- **Auth**: Clerk authentication with session management
- **Payments**: Razorpay integration for INR/USD
- **AI**: OpenAI GPT-4o-mini for trip planning
- **Caching**: Upstash Redis for API responses
- **External APIs**: Amadeus/RapidAPI for flights, Foursquare for places

### Key Directory Structure
```
app/
├── api/                    # API routes
│   ├── trips/             # Trip CRUD operations
│   ├── flights/search/    # Flight search with real pricing
│   ├── health/            # Health check endpoint
│   └── subscription/      # Payment processing
├── (pages)/               # App pages with layouts
└── globals.css           # Global styles

components/
├── ui/                   # shadcn/ui base components
├── marketing/            # Landing page components
├── layout/              # Navigation and footer
└── providers/           # React context providers

lib/
├── database/schema.ts   # Drizzle database schema
├── auth/profile.ts     # User profile management
├── subscription/       # Payment and tier logic
├── db.ts              # Database connection utilities
└── utils.ts           # Common utilities
```

### Database Schema Overview
- **users/profiles**: User data with subscription tiers (free/starter/pro)
- **trips**: User travel plans with destinations and budgets
- **itineraries**: AI-generated trip details with versioning
- **places**: Cached location data from external APIs
- **priceQuotes**: Flight/hotel pricing cache with expiration

### Authentication Flow
- Clerk handles all auth (sign-in/up redirects to `/trips`)
- Middleware protects routes and checks subscription tiers
- User profiles track usage limits and subscription status

### API Integration Pattern
- Flight search: Amadeus API → RapidAPI → Enhanced mock data fallback
- All external APIs have graceful degradation and caching
- Database operations use safe wrappers with availability checks

### Environment Variables Required
```bash
# Core functionality
DATABASE_URL=              # Neon PostgreSQL
UPSTASH_REDIS_REST_URL=   # Redis cache
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=

# Enhanced features (optional)
AMADEUS_CLIENT_ID=        # Flight pricing
RAPIDAPI_KEY=             # Flight search fallback
RAZORPAY_KEY_ID=          # Payments
FOURSQUARE_API_KEY=       # Places data
```

### Development Workflow
1. Always run `npm run typecheck` before committing
2. Test database changes locally before migration
3. API endpoints include comprehensive error handling and auth checks
4. Mock data fallbacks ensure app works without external API keys
5. Use Drizzle Studio to inspect database during development

### Code Patterns
- All API routes use Zod for input validation
- Database operations wrapped in `withDatabase()` for safety
- User subscription limits checked before paid features
- External API calls have timeout and retry logic
- All dates stored as timestamps, currency as enum (INR/USD)