# Testing Documentation

## Overview
Comprehensive testing strategy covering unit tests, integration tests, and end-to-end testing to ensure reliability and quality of the Tripthesia platform.

## Testing Strategy

### Test Pyramid
```
    /\
   /  \
  / E2E \     <- Few, high-value user journeys
 /______\
/        \
| Integration | <- API contracts, database operations  
|____________|
|            |
|    Unit     | <- Business logic, utilities, components
|____________|
```

### Testing Principles
- **Test Behavior, Not Implementation**: Focus on user outcomes
- **Fast Feedback**: Unit tests run in <30s, integration in <2min
- **Reliable**: Tests should be deterministic and stable
- **Maintainable**: Tests should be easy to understand and update

## Unit Testing

### Framework Setup
```typescript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Component Testing
```typescript
// __tests__/components/trip-wizard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripWizard } from '@/components/trip-wizard';

describe('TripWizard', () => {
  it('should complete full wizard flow', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    
    render(<TripWizard onComplete={onComplete} />);
    
    // Step 1: Destinations
    await user.type(screen.getByLabelText(/destination/i), 'Paris');
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 2: Trip Type  
    await user.click(screen.getByLabelText(/leisure/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 3: Budget
    const budgetSlider = screen.getByRole('slider');
    await user.clear(budgetSlider);
    await user.type(budgetSlider, '2000');
    
    await user.click(screen.getByRole('button', { name: /create trip/i }));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        destinations: [{ city: 'Paris', country: 'France' }],
        tripType: 'leisure',
        budget: 2000,
      });
    });
  });

  it('should validate required fields', async () => {
    render(<TripWizard onComplete={jest.fn()} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);
    
    expect(screen.getByText(/destination is required/i)).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// __tests__/hooks/use-trip-generation.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTripGeneration } from '@/hooks/use-trip-generation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTripGeneration', () => {
  it('should generate trip successfully', async () => {
    const { result } = renderHook(
      () => useTripGeneration(),
      { wrapper: createWrapper() }
    );
    
    const tripParams = {
      destinations: [{ city: 'Tokyo', country: 'Japan' }],
      startDate: '2025-06-01',
      endDate: '2025-06-07',
      budget: 3000,
    };
    
    result.current.generateTrip(tripParams);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toMatchObject({
      tripId: expect.any(String),
      days: expect.any(Array),
    });
  });
});
```

### Utility Testing
```typescript
// __tests__/lib/utils.test.ts
import { formatCurrency, calculateTravelTime } from '@/lib/utils';

describe('utils', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,235');
    });
    
    it('should format EUR correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,235');
    });
  });
  
  describe('calculateTravelTime', () => {
    it('should calculate walking time', () => {
      const from = { lat: 40.7589, lng: -73.9851 }; // Times Square
      const to = { lat: 40.7614, lng: -73.9776 };   // Bryant Park
      
      const time = calculateTravelTime(from, to, 'walking');
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(20); // Should be under 20 minutes
    });
  });
});
```

## Integration Testing

### API Route Testing
```typescript
// __tests__/api/trips.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/trips/route';
import { db } from '@/lib/db';

// Mock authentication
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'user_test123' }),
}));

describe('/api/trips', () => {
  afterEach(async () => {
    // Clean up test data
    await db.delete(trips).where(eq(trips.userId, 'user_test123'));
  });
  
  it('POST should create new trip', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        destinations: [{ city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 }],
        startDate: '2025-06-01',
        endDate: '2025-06-07',
        tripType: 'leisure',
        budget: 2000,
      },
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data).toMatchObject({
      id: expect.any(String),
      status: 'draft',
      userId: 'user_test123',
    });
    
    // Verify in database
    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, data.id),
    });
    expect(trip).toBeTruthy();
  });
  
  it('POST should validate required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}, // Missing required fields
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toContain('validation error');
  });
});
```

### Database Testing
```typescript
// __tests__/lib/db.test.ts
import { db } from '@/lib/db';
import { users, profiles, trips } from '@/lib/schema';

describe('Database Operations', () => {
  const testUserId = 'user_test_db';
  
  afterEach(async () => {
    // Cleanup in reverse dependency order
    await db.delete(trips).where(eq(trips.userId, testUserId));
    await db.delete(profiles).where(eq(profiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });
  
  it('should create user with profile', async () => {
    // Create user
    const [user] = await db.insert(users).values({
      id: testUserId,
      email: 'test@example.com',
    }).returning();
    
    // Create profile
    const [profile] = await db.insert(profiles).values({
      userId: testUserId,
      displayName: 'Test User',
      budgetBand: 'medium',
    }).returning();
    
    expect(user.id).toBe(testUserId);
    expect(profile.userId).toBe(testUserId);
    expect(profile.displayName).toBe('Test User');
  });
  
  it('should enforce foreign key constraints', async () => {
    // Try to create profile without user
    await expect(
      db.insert(profiles).values({
        userId: 'nonexistent_user',
        displayName: 'Test',
      })
    ).rejects.toThrow();
  });
});
```

### External API Testing
```typescript
// __tests__/lib/foursquare.test.ts
import { searchPlaces } from '@/lib/foursquare';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://api.foursquare.com/v3/places/search', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          {
            fsq_id: '4b158184f964a520f4ac23e3',
            name: 'Central Park',
            location: {
              geocodes: { main: { latitude: 40.78838, longitude: -73.96732 } }
            },
            categories: [{ name: 'Park' }],
            rating: 9.2,
          }
        ]
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Foursquare Integration', () => {
  it('should search places successfully', async () => {
    const results = await searchPlaces({
      lat: 40.7589,
      lng: -73.9851,
      query: 'park',
    });
    
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: '4b158184f964a520f4ac23e3',
      name: 'Central Park',
      category: 'Park',
      rating: 9.2,
    });
  });
});
```

## End-to-End Testing

### Playwright Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Critical User Journeys
```typescript
// e2e/trip-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Trip Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'user_test123');
    });
  });

  test('should create and customize trip', async ({ page }) => {
    // Start trip creation
    await page.click('text=Plan Your Trip');
    
    // Fill trip wizard
    await page.fill('[data-testid=destination-input]', 'Paris');
    await page.click('[data-testid=destination-suggestion]:first-child');
    await page.click('text=Next');
    
    // Select trip type
    await page.click('[data-testid=trip-type-leisure]');
    await page.click('text=Next');
    
    // Set budget
    await page.fill('[data-testid=budget-input]', '2000');
    await page.click('text=Create Trip');
    
    // Wait for generation
    await expect(page.locator('[data-testid=trip-timeline]')).toBeVisible({
      timeout: 15000,
    });
    
    // Verify itinerary structure
    const days = page.locator('[data-testid=day-card]');
    await expect(days).toHaveCount(7); // 7-day trip
    
    // Test drag and drop
    const firstActivity = page.locator('[data-testid=activity-card]:first-child');
    const secondDay = page.locator('[data-testid=day-card]:nth-child(2)');
    
    await firstActivity.dragTo(secondDay);
    
    // Verify activity moved
    await expect(secondDay.locator('[data-testid=activity-card]')).toHaveCount(4);
    
    // Test sharing
    await page.click('[data-testid=share-button]');
    const shareUrl = await page.locator('[data-testid=share-url]').textContent();
    expect(shareUrl).toContain('/s/');
    
    // Test export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid=export-pdf]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/paris-trip.*\.pdf/);
  });
  
  test('should handle generation errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/trips/*/generate', route => {
      route.fulfill({ status: 500, body: 'Generation failed' });
    });
    
    await page.goto('/new');
    
    // Fill minimum required fields
    await page.fill('[data-testid=destination-input]', 'Paris');
    await page.click('text=Create Trip');
    
    // Should show error message
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('text=Generation failed')).toBeVisible();
    
    // Should offer retry
    await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
  });
});
```

### Payment Flow Testing
```typescript
// e2e/subscription.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test('should upgrade to Pro successfully', async ({ page }) => {
    await page.goto('/billing');
    
    // Click upgrade button
    await page.click('[data-testid=upgrade-to-pro]');
    
    // Should redirect to Stripe Checkout (test mode)
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    
    // Fill test payment details
    await page.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
    await page.fill('[data-elements-stable-field-name="cardExpiry"]', '12/34');
    await page.fill('[data-elements-stable-field-name="cardCvc"]', '123');
    await page.fill('[data-elements-stable-field-name="billingName"]', 'Test User');
    
    // Complete payment
    await page.click('[data-testid=submit-payment]');
    
    // Should redirect back to app
    await expect(page).toHaveURL('/billing?success=true');
    await expect(page.locator('text=Welcome to Pro')).toBeVisible();
    
    // Verify Pro features are available
    await page.goto('/new');
    await expect(page.locator('[data-testid=pro-features]')).toBeVisible();
  });
});
```

## Performance Testing

### Load Testing with Playwright
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');
    
    // Measure performance
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const metrics = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime;
            }
            if (entry.name === 'first-input-delay') {
              metrics.fid = entry.processingStart - entry.startTime;
            }
            if (entry.name === 'cumulative-layout-shift') {
              metrics.cls = entry.value;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });
    
    // Assert Core Web Vitals thresholds
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.fid).toBeLessThan(100);  // FID < 100ms
    expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
  });
  
  test('should generate trip within performance budget', async ({ page }) => {
    await page.goto('/new');
    
    const startTime = Date.now();
    
    // Create trip
    await page.fill('[data-testid=destination-input]', 'Paris');
    await page.click('text=Create Trip');
    
    // Wait for completion
    await expect(page.locator('[data-testid=trip-timeline]')).toBeVisible();
    
    const endTime = Date.now();
    const generationTime = endTime - startTime;
    
    expect(generationTime).toBeLessThan(10000); // < 10 seconds
  });
});
```

## Test Data Management

### Test Database Setup
```typescript
// jest.setup.js
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Use test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

beforeEach(async () => {
  // Clean up test data
  await db.execute(sql`
    DELETE FROM price_quotes WHERE trip_id IN (
      SELECT id FROM trips WHERE user_id LIKE 'user_test%'
    )
  `);
  await db.execute(sql`DELETE FROM trips WHERE user_id LIKE 'user_test%'`);
  await db.execute(sql`DELETE FROM profiles WHERE user_id LIKE 'user_test%'`);
  await db.execute(sql`DELETE FROM users WHERE id LIKE 'user_test%'`);
});
```

### Mock Data Factory
```typescript
// __tests__/factories.ts
import { faker } from '@faker-js/faker';

export const createMockTrip = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: 'user_test123',
  title: faker.location.city() + ' Adventure',
  destinations: [
    {
      city: faker.location.city(),
      country: faker.location.country(),
      lat: parseFloat(faker.location.latitude()),
      lng: parseFloat(faker.location.longitude()),
    }
  ],
  startDate: faker.date.future(),
  endDate: faker.date.future(),
  tripType: faker.helpers.arrayElement(['business', 'leisure', 'adventure']),
  budget: faker.number.int({ min: 1000, max: 10000 }),
  status: 'draft',
  ...overrides,
});

export const createMockItinerary = (tripId: string) => ({
  tripId,
  days: Array.from({ length: 5 }, (_, i) => ({
    date: faker.date.future().toISOString().split('T')[0],
    items: Array.from({ length: 4 }, () => ({
      id: faker.string.uuid(),
      place: {
        id: `fsq_${faker.string.alphanumeric(8)}`,
        name: faker.company.name(),
        category: faker.helpers.arrayElement(['restaurant', 'attraction', 'hotel']),
        lat: parseFloat(faker.location.latitude()),
        lng: parseFloat(faker.location.longitude()),
        source: 'fsq' as const,
      },
      start: faker.date.future().toISOString(),
      end: faker.date.future().toISOString(),
      kind: faker.helpers.arrayElement(['sight', 'food', 'lodging']),
    })),
  })),
  summary: faker.lorem.paragraph(),
  currency: 'USD',
});
```

## Test Automation

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit
      - run: pnpm test:integration
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm test:e2e
        
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Quality Gates

### Coverage Requirements
- **Minimum Coverage**: 80% for all metrics
- **Critical Paths**: 100% coverage for payment, auth, data safety
- **New Code**: Must maintain or improve coverage

### Test Quality Metrics
- **Test Reliability**: <5% flaky test rate
- **Test Speed**: Unit tests <30s, integration <2min, E2E <10min
- **Maintenance**: Tests updated with feature changes

### Quality Checks
```typescript
// Custom Jest matchers
expect.extend({
  toBeValidItinerary(received) {
    const isValid = 
      received.days &&
      received.days.length > 0 &&
      received.days.every(day => 
        day.items && day.items.length > 0
      );
    
    return {
      message: () => `Expected valid itinerary structure`,
      pass: isValid,
    };
  },
});

// Usage in tests
expect(generatedItinerary).toBeValidItinerary();
```