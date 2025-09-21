# Google Maps API Setup Guide

This guide will help you set up Google Maps API integration for Tripthesia's road trip planning features.

## 🚀 Current Implementation Status (January 2025)

**Integration Status:** ✅ PARTIALLY IMPLEMENTED
- **Road Trip Page:** `/app/road-trip/page.tsx` - ✅ Basic implementation
- **Map Provider:** Unified map provider with Mapbox primary, Google Maps fallback
- **Component:** `components/planning/InteractiveMapPlanner.tsx` - ✅ Implemented
- **Route Optimization:** Advanced 2-opt algorithm with traffic-aware routing
- **POI Discovery:** Multi-source integration (OpenTripMap + Foursquare + Google Places)

**Next Steps:**
- 🔧 Enhanced Google Maps integration for premium features
- 🔧 Street View integration for location preview
- 🔧 Advanced traffic and real-time data integration
- 🔧 Location autocomplete with Google Places API

## Required APIs

Enable the following APIs in Google Cloud Console:

1. **Maps JavaScript API** - For interactive map display
2. **Routes API** - For route calculation and optimization  
3. **Places API** - For POI detection and place details
4. **Geocoding API** - For address-to-coordinates conversion
5. **Distance Matrix API** - For travel time calculations

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

### 2. Enable APIs

```bash
# Using gcloud CLI (optional)
gcloud services enable maps-backend.googleapis.com
gcloud services enable routes.googleapis.com  
gcloud services enable places-backend.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
```

Or enable manually in the Console:
- Navigate to "APIs & Services" > "Library"
- Search and enable each required API

### 3. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. Click "Restrict Key" for security

### 4. Configure API Restrictions

**Application Restrictions:**
- HTTP referrers for web usage
- Add your domains: `localhost:3000`, `*.vercel.app`, `tripthesia.com`

**API Restrictions:**
- Restrict to the 5 APIs listed above
- This prevents unauthorized usage

### 5. Set Environment Variable

Add to your `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 6. Verify Setup

Run the development server and check the road trip page:
```bash
npm run dev
```

Navigate to `http://localhost:3000/road-trip` to test the integration.

## 🔧 Current Implementation Details (January 2025)

### ✅ What's Working
- **Unified Map Provider** (`lib/services/unified-map-provider.ts`)
  - Mapbox GL JS as primary provider with cost optimization
  - Google Maps as fallback with automatic provider detection
  - Abstract BaseMapProvider class for provider abstraction
- **Interactive Map Planner** (`components/planning/InteractiveMapPlanner.tsx`)
  - Provider detection and automatic fallback mechanism
  - Enhanced map controls with responsive design
- **Route Optimization** (`lib/planning/enhanced-route-optimizer.ts`)
  - 2-opt algorithm implementation for optimal route calculation
  - Traffic-aware routing with real-time delay estimation
  - Vehicle type selection and cost estimation
- **POI Discovery** (`lib/services/enhanced-poi-detector.ts`)
  - Multi-source POI integration (OpenTripMap + Foursquare + Google Places)
  - Intelligent route-based filtering with distance calculations

### 🔧 Enhancement Opportunities
- **Google Maps Premium Features**
  - Street View integration for better location preview
  - Advanced traffic data with real-time conditions
  - Enhanced Places API integration for autocomplete
  - Detailed business information and reviews
- **Transport Integration**
  - Integration with transport page for route visualization
  - Real-time transport schedule overlay
  - Multi-modal journey visualization

## Pricing Information (2025)

Google Maps Platform now uses a credit-based system:

- **10,000 free API calls per month** per API
- **Routes API**: $5 per 1,000 requests after free tier
- **Places API**: $17 per 1,000 requests (Text Search)
- **Maps JavaScript API**: $7 per 1,000 map loads
- **Geocoding API**: $5 per 1,000 requests
- **Distance Matrix API**: $10 per 1,000 requests

## Cost Optimization

Our implementation includes several cost-saving measures:

1. **API Response Caching** - Results cached in Upstash Redis
2. **Batch Requests** - Multiple POIs fetched in single calls
3. **Smart Filtering** - Only relevant POIs requested
4. **Request Debouncing** - Prevents excessive API calls
5. **Graceful Degradation** - Mock data when APIs unavailable

## Troubleshooting

**Common Issues:**

1. **"This page can't load Google Maps correctly"**
   - Check API key in environment variables
   - Verify domain restrictions allow localhost:3000

2. **"REQUEST_DENIED" errors**
   - Ensure all required APIs are enabled
   - Check API key restrictions match your domain

3. **Quota exceeded**
   - Monitor usage in Google Cloud Console
   - Implement additional caching if needed

4. **CORS errors**
   - Add proper HTTP referrer restrictions
   - Ensure Next.js is serving from allowed domains

## Security Best Practices

1. **Never commit API keys** - Use environment variables only
2. **Restrict API key usage** - Limit to specific domains and APIs  
3. **Monitor usage regularly** - Set up billing alerts
4. **Use least privilege** - Only enable required APIs
5. **Rotate keys periodically** - Generate new keys every 6 months

## Development vs Production

**Development:**
- Use `localhost:3000` in referrer restrictions
- Monitor usage to avoid surprise charges
- Test with smaller datasets

**Production:**
- Add production domains to restrictions
- Set up billing alerts
- Consider API key rotation schedule
- Monitor performance and costs

## Support

For issues with this integration:
1. Check Google Maps Platform documentation
2. Verify API quotas and billing
3. Test with simple HTML page to isolate Next.js issues
4. Check browser console for detailed error messages