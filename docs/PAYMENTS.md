# Payments Documentation

## Overview
Tripthesia uses Stripe for subscription management with a freemium model: Free tier with basic features and Pro tier with advanced functionality.

## Subscription Plans

### Free Plan
- **Price**: $0/month
- **Features**:
  - 5 trip plans per month
  - Basic itinerary generation
  - Standard place suggestions
  - Export to PDF/Calendar
  - Community support
- **Limitations**:
  - No real-time rerouting
  - No advanced filters
  - No collaboration features
  - Standard support only

### Pro Plan
- **Price**: $19/month or $190/year (17% savings)
- **Features**:
  - Unlimited trip plans
  - Advanced AI planning
  - Real-time weather rerouting
  - Premium place database
  - Advanced filtering & search
  - Collaborative trip editing
  - Priority support
  - Early access to new features
- **Target Market**: Frequent travelers, travel professionals, families

## Stripe Integration

### Configuration
```typescript
// lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

// Products and Prices
export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    features: ["5 trips/month", "Basic planning", "PDF export"],
  },
  PRO_MONTHLY: {
    name: "Pro Monthly", 
    priceId: "price_pro_monthly",
    price: 1900, // $19.00 in cents
    features: ["Unlimited trips", "Advanced AI", "Real-time updates"],
  },
  PRO_YEARLY: {
    name: "Pro Yearly",
    priceId: "price_pro_yearly", 
    price: 19000, // $190.00 in cents
    features: ["All Pro features", "17% savings", "Priority support"],
  },
} as const;
```

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Checkout Flow

### Subscription Checkout
```typescript
// lib/stripe-helpers.ts
export async function createCheckoutSession({
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: await getUserEmail(userId),
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}
```

### Checkout API Route
```typescript
// api/billing/checkout/route.ts
import { auth } from "@clerk/nextjs";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();
  
  if (!PLANS.PRO_MONTHLY.priceId && !PLANS.PRO_YEARLY.priceId) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  try {
    const session = await createCheckoutSession({
      priceId,
      userId,
      successUrl: `${req.nextUrl.origin}/billing?success=true`,
      cancelUrl: `${req.nextUrl.origin}/billing?cancelled=true`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
```

### Client-Side Checkout
```typescript
// components/upgrade-button.tsx
"use client";

import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function UpgradeButton({ priceId }: { priceId: string }) {
  const handleUpgrade = async () => {
    const stripe = await stripePromise;
    if (!stripe) return;

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const { sessionId } = await response.json();
    
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <Button onClick={handleUpgrade}>
      Upgrade to Pro
    </Button>
  );
}
```

## Webhook Handling

### Stripe Webhooks
```typescript
// api/webhooks/stripe/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({error: "Invalid signature"}, {status: 400});
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Webhook Event Handlers
```typescript
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  // Upgrade user to Pro
  await db.update(profiles)
    .set({ 
      pro: true,
      stripeCustomerId: session.customer as string,
      subscriptionId: session.subscription as string,
    })
    .where(eq(profiles.userId, userId));

  // Send welcome email
  await sendWelcomeEmail(userId);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Downgrade user to Free
  await db.update(profiles)
    .set({ 
      pro: false,
      subscriptionId: null,
    })
    .where(eq(profiles.userId, userId));

  // Send cancellation email
  await sendCancellationEmail(userId);
}
```

## Customer Portal

### Portal Session Creation
```typescript
// api/billing/portal/route.ts
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(userId);
  if (!profile?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No customer found" },
      { status: 400 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${req.nextUrl.origin}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Portal Button Component
```typescript
// components/billing-portal-button.tsx
export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    
    const response = await fetch("/api/billing/portal", {
      method: "POST",
    });
    
    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <Button onClick={handlePortal} disabled={loading}>
      {loading ? "Loading..." : "Manage Subscription"}
    </Button>
  );
}
```

## Usage Tracking & Limits

### Feature Gating
```typescript
// lib/usage.ts
export async function checkFeatureAccess(
  userId: string, 
  feature: 'unlimited_trips' | 'reroute' | 'collaboration'
) {
  const profile = await getUserProfile(userId);
  
  if (profile?.pro) {
    return { allowed: true };
  }

  switch (feature) {
    case 'unlimited_trips':
      const tripCount = await getMonthlyTripCount(userId);
      return { 
        allowed: tripCount < 5,
        usage: tripCount,
        limit: 5 
      };
    
    case 'reroute':
    case 'collaboration':
      return { allowed: false, reason: 'Pro feature' };
    
    default:
      return { allowed: true };
  }
}

// Usage tracking
export async function trackFeatureUsage(
  userId: string,
  feature: string,
  metadata?: any
) {
  await db.insert(usageEvents).values({
    userId,
    feature,
    metadata,
    timestamp: new Date(),
  });
}
```

### Usage Enforcement
```typescript
// api/trips/route.ts
export async function POST(req: NextRequest) {
  const { userId } = auth();
  const access = await checkFeatureAccess(userId!, 'unlimited_trips');
  
  if (!access.allowed) {
    return NextResponse.json(
      { 
        error: "Trip limit reached", 
        limit: access.limit,
        usage: access.usage,
        upgradeRequired: true 
      },
      { status: 402 } // Payment Required
    );
  }
  
  // Process trip creation
  await trackFeatureUsage(userId!, 'trip_created');
}
```

## Billing Dashboard

### Subscription Status Component
```typescript
// components/subscription-status.tsx
export function SubscriptionStatus({ profile }: { profile: Profile }) {
  if (!profile.pro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>
            You're currently on the free plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Trip plans this month</span>
              <span>3/5</span>
            </div>
            <Progress value={60} />
          </div>
          <UpgradeButton priceId={PLANS.PRO_MONTHLY.priceId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pro Plan</CardTitle>
        <CardDescription>
          You have access to all Pro features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Status</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <BillingPortalButton />
        </div>
      </CardContent>
    </Card>
  );
}
```

## Revenue Analytics

### Key Metrics Tracking
```typescript
// lib/analytics.ts
export async function trackRevenue(event: {
  type: 'subscription_created' | 'subscription_upgraded' | 'subscription_cancelled';
  userId: string;
  amount: number;
  currency: string;
  plan: string;
}) {
  // Send to PostHog
  posthog.capture({
    distinctId: event.userId,
    event: event.type,
    properties: {
      amount: event.amount,
      currency: event.currency,
      plan: event.plan,
    },
  });

  // Store in database for reporting
  await db.insert(revenueEvents).values({
    ...event,
    timestamp: new Date(),
  });
}
```

### Revenue Reporting
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Churn rate by cohort
- Lifetime Value (LTV)
- Customer Acquisition Cost (CAC)

## Tax & Compliance

### Tax Calculation
- Automatic tax calculation via Stripe Tax
- Support for global tax requirements
- VAT handling for EU customers
- Sales tax for US customers

### Data Privacy
- PCI DSS compliance via Stripe
- No card data stored locally
- GDPR compliance for EU customers
- Data retention policies

## Testing

### Test Mode Setup
```typescript
// Use Stripe test keys in development
const stripe = new Stripe(
  process.env.NODE_ENV === "production" 
    ? process.env.STRIPE_SECRET_KEY!
    : process.env.STRIPE_TEST_SECRET_KEY!
);

// Test card numbers
const TEST_CARDS = {
  VISA_SUCCESS: "4242424242424242",
  VISA_DECLINE: "4000000000000002", 
  MASTERCARD: "5555555555554444",
};
```

### Webhook Testing
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test specific events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

## Error Handling

### Payment Failures
```typescript
// Handle various failure scenarios
export function handlePaymentError(error: Stripe.StripeError) {
  switch (error.code) {
    case 'card_declined':
      return "Your card was declined. Please try a different payment method.";
    case 'insufficient_funds':
      return "Insufficient funds. Please try a different card.";
    case 'subscription_creation_failed':
      return "Unable to create subscription. Please try again.";
    default:
      return "Payment failed. Please contact support.";
  }
}
```

### Subscription Edge Cases
- Failed payment retry logic
- Dunning management
- Subscription pausing
- Proration handling
- Plan downgrade restrictions

## Security

### Payment Security
- PCI DSS Level 1 compliance via Stripe
- No sensitive payment data stored
- Secure webhook signature verification
- Rate limiting on payment endpoints

### Fraud Prevention
- Stripe Radar for fraud detection
- Velocity checking
- Geographic restrictions if needed
- Manual review flags

## Monitoring

### Payment Metrics
- Conversion rates by plan
- Failed payment rates
- Churn analysis
- Revenue per user

### Alerting
- Failed webhook deliveries
- High churn rates
- Payment processing errors
- Subscription anomalies