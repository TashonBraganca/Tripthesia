# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Primary Development Workflow
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Production build (run before deployment)
npm run typecheck    # TypeScript type checking - MUST PASS before commits
npm run lint         # ESLint checking - fix all errors before pushing
```

### Database Management (PostgreSQL via Neon)
```bash
npm run db:generate  # Generate Drizzle migrations after schema changes
npm run db:migrate   # Apply migrations to database
npm run db:studio    # Open Drizzle Studio for database inspection
```

### Performance & Testing
```bash
npm run analyze                 # Bundle analysis with visual report
npm run accessibility:test      # Run accessibility audit
npm run security-audit         # Security vulnerability scan
npm run load-test              # Performance load testing
```

## High-Level Architecture

### Tech Stack Overview
- **Framework**: Next.js 14 with App Router (React 18, TypeScript 5.3)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Clerk (handles all auth flows)
- **Payments**: Razorpay (INR/USD support)
- **AI Integration**: OpenAI GPT-4o-mini for trip planning
- **Caching**: Upstash Redis for API response caching
- **Maps**: Mapbox (primary), Google Maps (premium features)
- **Styling**: Tailwind CSS + shadcn/ui components

### Critical Architecture Patterns

#### 1. Database Safety Pattern
All database operations MUST use the `withDatabase()` wrapper:
```typescript
// lib/db.ts pattern - ensures database availability
export async function withDatabase<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T>
```
This prevents crashes when database is unavailable.

#### 2. API Route Structure
All API routes follow this pattern:
- Zod validation for inputs
- Authentication check via Clerk
- Database operation with error handling
- Structured JSON response
```typescript
// Standard API route structure
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = schema.parse(body); // Zod validation

  return withDatabase(async () => {
    // Database operations
  }, { error: "Service unavailable" });
}
```

#### 3. Component Organization
```
components/
├── ui/           # Base shadcn/ui components (DO NOT MODIFY directly)
├── forms/        # Form components with validation
├── ai/           # AI-powered features (lazy loaded for performance)
├── planning/     # Trip planning components
└── layout/       # Navigation, footer, page layouts
```

#### 4. State Management Pattern
- Server state: React Query for API data
- Form state: Controlled components with validation
- Global state: React Context for user/theme
- URL state: Next.js searchParams for filters

### Database Schema Key Tables

#### Core Tables
- `users` - Clerk user IDs and emails
- `profiles` - User preferences, subscription info, usage tracking
- `trips` - User trips with destinations, dates, budgets
- `draft_trips` - Auto-saved trip progress (step-by-step saving)
- `itineraries` - AI-generated trip details with versioning
- `places` - Cached location data from APIs
- `price_quotes` - Flight/hotel pricing with expiration

#### Personalization Tables (Phase 4.3)
- `user_preferences` - Learned user preferences with confidence scores
- `user_interactions` - Behavioral tracking for recommendations
- `recommendation_feedback` - User feedback on suggestions
- `user_clusters` - Similarity grouping for collaborative filtering
- `personalized_recommendations` - Cached personalized content

### Critical UI Components

#### Portal-based Dropdowns (z-index management)
- `components/ui/portal-dropdown.tsx` - Handles all dropdown positioning
- Uses React Portal for rendering outside DOM hierarchy
- Collision detection with viewport boundaries
- Z-index: 9999999 for dropdowns to appear above all content

#### Date Picker Integration
- `components/forms/ShadCNDatePicker.tsx` - Main date picker
- Uses react-day-picker with Popover wrapper
- State management through parent component
- Z-index properly configured for overlay

#### Step Navigation System
- `components/forms/FlexibleStepper.tsx` - 6-step trip planning
- Steps: Destination → Transport → Local Rides → Stay → Activities → Dining
- Supports jumping between any steps
- Mobile responsive with collapsible design

### API Integration Patterns

#### External API Fallback Chain
```
Flight Search: Kiwi → Amadeus → Mock Data
Hotel Search: Booking.com → Amadeus → Mock Data
POI Search: OpenTripMap → Foursquare → Yelp → Static Data
AI Generation: Gemini 2.5 → GPT-4o-mini → Algorithmic
```

#### Rate Limiting Strategy
- Exponential backoff for all external APIs
- Redis caching with TTL (flights: 15min, hotels: 1hr, POI: 24hr)
- Circuit breaker pattern for unstable services
- Monitor usage at 80% quota threshold

### Performance Optimizations

#### Code Splitting Configuration
Advanced webpack configuration in `next.config.js`:
- Framework chunk: React/React-DOM separately
- AI components: Lazy loaded on demand
- Planning components: Separate chunk
- Maps services: Isolated for performance
- Animation libraries: Bundled separately

#### Bundle Size Targets
- Initial page load: < 200KB
- Lazy components: < 100KB each
- Total application: < 2MB
- Cache hit rate: > 60%

### Common Development Tasks

#### Adding a New API Endpoint
1. Create route in `app/api/[feature]/route.ts`
2. Add Zod schema for validation
3. Implement auth check
4. Use `withDatabase()` for DB operations
5. Add error handling and logging
6. Test with mock data fallback

#### Modifying Database Schema
1. Edit `lib/database/schema.ts`
2. Run `npm run db:generate` to create migration
3. Review migration file in `lib/database/migrations/`
4. Run `npm run db:migrate` to apply
5. Update TypeScript types if needed

#### Implementing New UI Components
1. Check if shadcn/ui has the component: `npx shadcn@latest add [component]`
2. Create in appropriate directory under `components/`
3. Use existing patterns for consistency
4. Ensure proper TypeScript types
5. Add loading states and error boundaries
6. Test responsiveness and accessibility

### Environment Variables Structure
```env
# Required for basic functionality
DATABASE_URL=                      # Neon PostgreSQL connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # Clerk auth (public)
CLERK_SECRET_KEY=                  # Clerk auth (server)
OPENAI_API_KEY=                    # AI trip generation

# Caching & Performance
UPSTASH_REDIS_REST_URL=           # Redis cache
UPSTASH_REDIS_REST_TOKEN=         # Redis auth

# External APIs (optional but recommended)
FOURSQUARE_API_KEY=                # Places and restaurants
AMADEUS_CLIENT_ID=                 # Flight search
AMADEUS_CLIENT_SECRET=             # Flight auth
MAPBOX_ACCESS_TOKEN=               # Primary maps
GOOGLE_MAPS_API_KEY=               # Maps fallback

# Payments (production only)
RAZORPAY_KEY_ID=                   # Payment processing
RAZORPAY_KEY_SECRET=               # Payment auth
```

### Testing & Validation Checklist
Before committing any changes:
1. ✅ Run `npm run typecheck` - MUST pass
2. ✅ Run `npm run lint` - Fix all errors
3. ✅ Run `npm run build` - Ensure production build works
4. ✅ Test core user flows work without external APIs
5. ✅ Verify database migrations if schema changed
6. ✅ Check responsive design on mobile viewport
7. ✅ Test error states and loading states

### Recent Major Updates to Be Aware Of

#### UI/UX Restoration (Phase 9)
- 6-step navigation system fully restored in `/new` page
- Bento box layout with explicit grid positioning
- Dropdown z-index issues resolved (z-[9999999])
- Auto-save functionality with draft_trips table
- Professional typography and spacing standards

#### Production Excellence (Phase 7)
- Dynamic imports for heavy AI components
- Error boundaries with automatic retry
- Real-time performance monitoring
- Comprehensive micro-interactions library
- Bundle optimization with code splitting

### Critical Files for Understanding

#### Core Application Logic
- `app/new/page.tsx` - Main trip creation flow (650+ lines)
- `app/api/ai/generate-trip/route.ts` - AI trip generation
- `lib/database/schema.ts` - Complete database structure
- `components/forms/FlexibleStepper.tsx` - Step navigation

#### Configuration Files
- `next.config.js` - Webpack and build configuration
- `tailwind.config.js` - Design system configuration
- `drizzle.config.ts` - Database migration setup
- `middleware.ts` - Auth and routing logic

### Debugging Common Issues

#### Dropdown Appearing Behind Elements
- Check z-index in portal-dropdown.tsx
- Ensure parent has `relative` positioning
- Verify no `overflow: hidden` on ancestors

#### TypeScript Compilation Errors
- Run `npm run typecheck` for detailed errors
- Check for dynamic Tailwind classes (use helper functions)
- Verify all imports have proper types

#### Database Connection Issues
- Check DATABASE_URL in .env.local
- Ensure migrations are applied
- Use Drizzle Studio to inspect data
- All operations should use withDatabase wrapper

#### Build Failures
- Check for unescaped apostrophes in JSX
- Verify all environment variables are set
- Ensure no circular dependencies
- Run `npm run build:safe` for isolated build