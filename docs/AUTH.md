# Authentication Documentation

## Overview
Tripthesia uses Clerk for authentication with server-side sessions, providing secure user management, social logins, and webhook integration for user lifecycle events.

## Clerk Integration

### Configuration
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",                    // Landing page
    "/api/health",         // Health check
    "/api/webhooks/(.*)",  // Webhook endpoints
    "/s/(.*)",             // Shared trips
  ],
  ignoredRoutes: [
    "/api/webhooks/(.*)",  // No auth info needed
  ],
});
```

### Environment Variables
```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

## Authentication Flows

### Sign Up Flow
1. User visits `/sign-up` (Clerk component)
2. User provides email/password or social login
3. Email verification (if required)
4. `user.created` webhook triggers
5. User and profile records created in database
6. Redirect to onboarding or dashboard

### Sign In Flow
1. User visits `/sign-in` (Clerk component)
2. Authentication with Clerk
3. JWT token issued and stored
4. Redirect to intended destination
5. Middleware validates token on subsequent requests

### Social Login Support
- Google OAuth
- Apple Sign In
- GitHub (optional)
- Microsoft (optional)

## Server-Side Authentication

### Auth Helpers
```typescript
// lib/auth.ts
import { auth, currentUser } from "@clerk/nextjs";

export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  // Ensure user exists in database
  await db.insert(users)
    .values({
      id: userId,
      email: user.emailAddresses[0]?.emailAddress ?? "",
    })
    .onConflictDoNothing();

  return {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}
```

### API Route Protection
```typescript
// api/trips/route.ts
import { auth } from "@clerk/nextjs";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Process authenticated request
}
```

### Server Actions Protection
```typescript
// app/actions.ts
import { auth } from "@clerk/nextjs";

export async function createTrip(formData: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  
  // Process authenticated action
}
```

## User Profiles

### Profile Management
```typescript
// lib/auth.ts
export async function getUserProfile(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.userId, userId),
  });
  
  return profile;
}

export async function createOrUpdateProfile(
  userId: string,
  data: Partial<ProfileUpdate>
) {
  return await db.insert(profiles)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: data,
    })
    .returning();
}
```

### Profile Schema
```typescript
interface UserProfile {
  userId: string;
  displayName?: string;
  homeAirport?: string;        // IATA code
  budgetBand?: 'low' | 'med' | 'high';
  pace?: 'chill' | 'standard' | 'packed';
  mobility?: 'walk' | 'public' | 'car';
  preferences?: {
    cuisine?: string[];
    dietary?: string[];
    mustVisit?: string[];
    avoid?: string[];
    accessibility?: string[];
  };
  pro: boolean;
}
```

## Session Management

### Session Validation
```typescript
// middleware.ts - runs on every request
export default authMiddleware({
  beforeAuth: (auth, req) => {
    // Custom logic before auth check
  },
  afterAuth: (auth, req, evt) => {
    // Custom logic after auth check
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
});
```

### Session Context
```typescript
// Client-side session access
import { useUser, useAuth } from "@clerk/nextjs";

function ProfileComponent() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <SignInPrompt />;
  
  return <UserProfile user={user} onSignOut={signOut} />;
}
```

## Row Level Security (RLS)

### Database Policies
```sql
-- Users can only access their own data
CREATE POLICY user_trips_policy ON trips
  FOR ALL USING (user_id = current_setting('app.user_id'));

CREATE POLICY user_profiles_policy ON profiles
  FOR ALL USING (user_id = current_setting('app.user_id'));

-- Shared trips are publicly readable
CREATE POLICY shared_trips_policy ON trips
  FOR SELECT USING (
    shared_token IS NOT NULL AND 
    shared_token = current_setting('app.shared_token', true)
  );
```

### RLS Context Setting
```typescript
// Set user context for database queries
export async function withUserContext<T>(
  userId: string,
  callback: () => Promise<T>
): Promise<T> {
  await db.execute(sql`SET LOCAL app.user_id = ${userId}`);
  try {
    return await callback();
  } finally {
    await db.execute(sql`RESET app.user_id`);
  }
}

// Usage in API routes
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  
  return withUserContext(userId, async () => {
    // All database queries now respect RLS
    const trips = await db.query.trips.findMany();
    return NextResponse.json(trips);
  });
}
```

## Webhook Handlers

### User Lifecycle Webhooks
```typescript
// api/webhooks/clerk/route.ts
import { Webhook } from "svix";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const headers = req.headers;
  
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt;
  
  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": headers.get("svix-id")!,
      "svix-timestamp": headers.get("svix-timestamp")!,
      "svix-signature": headers.get("svix-signature")!,
    });
  } catch (err) {
    return NextResponse.json({error: "Invalid signature"}, {status: 400});
  }

  switch (evt.type) {
    case "user.created":
      await handleUserCreated(evt.data);
      break;
    case "user.updated": 
      await handleUserUpdated(evt.data);
      break;
    case "user.deleted":
      await handleUserDeleted(evt.data);
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

### Webhook Event Handlers
```typescript
async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name } = data;
  
  // Create user record
  await db.insert(users).values({
    id,
    email: email_addresses[0]?.email_address || "",
  });
  
  // Create default profile
  await db.insert(profiles).values({
    userId: id,
    displayName: `${first_name} ${last_name}`.trim() || null,
  });
}

async function handleUserDeleted(data: any) {
  const { id } = data;
  
  // Clean up user data (respecting foreign key constraints)
  await db.delete(profiles).where(eq(profiles.userId, id));
  await db.delete(users).where(eq(users.id, id));
}
```

## Shared Trip Access

### Public Trip Sharing
```typescript
// Generate shareable token
export async function shareTrip(tripId: string, userId: string) {
  const token = generateSecureToken();
  
  await db.update(trips)
    .set({ sharedToken: token })
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
  
  return {
    token,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${token}`,
  };
}

// Access shared trip
export async function getSharedTrip(token: string) {
  return await db.query.trips.findFirst({
    where: eq(trips.sharedToken, token),
    with: {
      itineraries: {
        orderBy: desc(itineraries.version),
        limit: 1,
      }
    }
  });
}
```

### Shared Trip Page
```typescript
// app/s/[token]/page.tsx
export default async function SharedTripPage({
  params,
}: {
  params: { token: string };
}) {
  const trip = await getSharedTrip(params.token);
  
  if (!trip) {
    return <TripNotFound />;
  }
  
  return (
    <div>
      <SharedTripHeader trip={trip} />
      <ReadOnlyItinerary data={trip.itineraries[0]?.data} />
      <CopyTripCTA tripId={trip.id} />
    </div>
  );
}
```

## Security Best Practices

### Token Management
- JWT tokens are httpOnly and secure
- Automatic token refresh
- Proper token expiration handling
- Secure token storage (not in localStorage)

### Access Control
- Route-level protection via middleware
- API endpoint authentication
- Database-level RLS policies
- Proper error handling (don't leak info)

### Session Security
- Session timeout handling
- Concurrent session management
- Secure cookie settings
- CSRF protection (built into Next.js)

## User Experience

### Authentication UI
- Custom-styled Clerk components
- Seamless social login flows
- Progressive onboarding
- Clear error messages

### Loading States
```typescript
function AuthenticatedPage() {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) return <AuthLoadingSpinner />;
  if (!isSignedIn) return <SignInPrompt />;
  
  return <AuthenticatedContent />;
}
```

### Error Handling
- Network error recovery
- Token expiration handling
- Graceful degradation
- User-friendly error messages

## Testing Authentication

### Test User Management
```typescript
// For development/testing
const testUser = {
  id: "user_test123",
  email: "test@tripthesia.com",
  firstName: "Test",
  lastName: "User"
};

// Mock authentication in tests
jest.mock("@clerk/nextjs", () => ({
  auth: () => ({ userId: "user_test123" }),
  currentUser: () => Promise.resolve(testUser),
}));
```

### Integration Tests
- Sign up/sign in flows
- Webhook processing
- Session management
- RLS policy enforcement

## Monitoring & Analytics

### Auth Metrics
- Sign up conversion rates
- Authentication method usage
- Session duration analytics
- Error rates by auth flow

### Security Monitoring
- Failed authentication attempts
- Suspicious activity patterns
- Token usage analytics
- Webhook delivery status