# Tripthesia - Travel Planning Platform

Generate perfect travel itineraries in seconds with intelligent planning. Real prices, availability, and booking links.

[![Deploy Status](https://img.shields.io/badge/deploy-vercel-black)](https://vercel.com)
[![API Health](https://img.shields.io/badge/api-healthy-green)](./api/health)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- Intelligent Planning - Advanced algorithms generate personalized itineraries
- Global Support - Works for Indian and international travelers
- Real Pricing - Live flight prices and booking links
- Interactive Maps - Mapbox integration with route planning
- Secure Authentication - Clerk authentication with social login
- Flexible Payments - Razorpay with UPI, cards, and international support
- Mobile Ready - Responsive design for all devices
- Lightning Fast - Optimized performance with caching

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/TashonBraganca/Tripthesia.git
cd tripthesia/production
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
# Fill in your API keys (see Environment Variables section)
```

### 4. Database Setup
```bash
npm run db:migrate
```

### 5. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Environment Variables

### Required for Basic Functionality
```bash
# Database & Cache
DATABASE_URL=your_neon_postgresql_url
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI
OPENAI_API_KEY=your_openai_api_key
```

### Required for Full Features
```bash
# Payments
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# External APIs
FOURSQUARE_API_KEY=your_foursquare_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Pricing Tiers

| Tier | Price | Trips/Month | Features |
|------|-------|-------------|----------|
| Free | ₹0 | 2 | Basic planning, PDF export |
| Starter | ₹800/$10 | 10 | Advanced planning, real-time pricing, maps |
| Pro | ₹2000/$20 | 30 | Premium features, collaboration, analytics |

## Architecture

```
┌─ Frontend (Next.js 14)
│  ├─ React 18 + TypeScript
│  ├─ Tailwind CSS + shadcn/ui
│  └─ Clerk Authentication
│
├─ Backend (API Routes)
│  ├─ Drizzle ORM + PostgreSQL
│  ├─ Upstash Redis Caching
│  └─ OpenAI GPT-4o-mini
│
├─ External Services
│  ├─ Foursquare (Places)
│  ├─ Mapbox (Maps)
│  └─ Razorpay (Payments)
│
└─ Infrastructure
   ├─ Vercel (Hosting)
   ├─ Neon (Database)
   └─ GitHub Actions (CI/CD)
```

## Deployment

### Automatic (Recommended)
1. Push to GitHub main branch
2. GitHub Actions automatically deploys to Vercel
3. Environment variables set in Vercel dashboard

### Manual
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## API Endpoints

### Core APIs
- `POST /api/trips` - Create new trip
- `GET /api/trips` - Get user trips  
- `POST /api/trips/[id]/generate` - Generate AI itinerary
- `GET /api/health` - System health check

### Subscription APIs
- `POST /api/subscription/checkout` - Create payment session
- `POST /api/webhooks/razorpay` - Payment webhooks

### Search APIs
- `POST /api/places/search` - Search places
- `POST /api/flights/search` - Search flights (mock data)

## Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript checking
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
```

### Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Test trip creation (requires auth)
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Trip","destinations":[...]}'
```

## Security

- Authentication - Clerk with secure session management
- Authorization - Route protection and user isolation
- Data Validation - Zod schemas for all inputs
- Rate Limiting - Upstash Redis rate limiting
- CORS - Proper cross-origin configuration
- Headers - Security headers configured

## International Support

### Currencies
- Indian Users: INR pricing with UPI/Cards
- International Users: USD pricing with international cards

### Languages
- English (primary)
- Hindi support planned

### Regions
- Optimized for: India, Southeast Asia, Global
- CDN: Vercel Edge Network

## Performance

- Page Load: <2s on 3G
- API Response: <500ms average
- Mobile: 95+ Lighthouse score
- Caching: Redis for API responses
- CDN: Global edge distribution

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Email: support@tripthesia.com
- Chat: Available in app
- Docs: [docs.tripthesia.com](https://docs.tripthesia.com)
- Issues: [GitHub Issues](https://github.com/TashonBraganca/Tripthesia/issues)

---

Built by Tashon Braganca for global travelers.