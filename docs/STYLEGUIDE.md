# Style Guide

## Overview
Comprehensive coding standards and conventions for the Tripthesia codebase to ensure consistency, maintainability, and team collaboration.

## TypeScript Standards

### Strict Configuration
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Definitions
```typescript
// ✅ Good: Explicit interface definitions
interface Trip {
  readonly id: string;
  readonly userId: string;
  title: string;
  destinations: readonly Destination[];
  startDate: Date;
  endDate: Date;
  tripType: TripType;
  budget?: number;
  status: TripStatus;
}

// ✅ Good: Union types for finite sets
type TripType = 'business' | 'leisure' | 'adventure' | 'research';
type TripStatus = 'draft' | 'generating' | 'planned' | 'shared' | 'traveling' | 'completed';

// ❌ Bad: Any types
const tripData: any = {};

// ❌ Bad: Implicit types
const destinations = [];
```

### Naming Conventions
```typescript
// ✅ Good: Descriptive names
const userTripCount = await getUserTripCount(userId);
const isProSubscriber = user.pro;
const generateItineraryMutation = useMutation(generateItinerary);

// ✅ Good: Boolean prefixes
const isLoading = false;
const hasError = false;
const canEdit = true;
const shouldRefresh = true;

// ✅ Good: Event handler naming
const handleTripCreate = () => {};
const handleActivityDrag = () => {};
const onSubscriptionUpgrade = () => {};

// ❌ Bad: Abbreviated names
const usrTrpCnt = 0;
const sub = false;
const cb = () => {};
```

### Function Signatures
```typescript
// ✅ Good: Explicit return types for public functions
export async function createTrip(
  params: CreateTripParams
): Promise<TripCreateResponse> {
  // implementation
}

// ✅ Good: Destructured parameters with types
interface UpdateTripParams {
  tripId: string;
  updates: Partial<Trip>;
  userId: string;
}

export async function updateTrip({
  tripId,
  updates,
  userId,
}: UpdateTripParams): Promise<Trip> {
  // implementation
}

// ✅ Good: Generic constraints
export function mapResults<T extends { id: string }>(
  items: T[],
  mapper: (item: T) => unknown
): unknown[] {
  return items.map(mapper);
}
```

## ESLint Configuration

### Rules Setup
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // React specific
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'error',
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
```

### Custom Rules
```typescript
// ✅ Good: Consistent error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to complete operation');
}

// ✅ Good: Exhaustive switch statements
function getTripStatusColor(status: TripStatus): string {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'generating':
      return 'yellow';
    case 'planned':
      return 'green';
    case 'shared':
      return 'blue';
    case 'traveling':
      return 'orange';
    case 'completed':
      return 'purple';
    default:
      // TypeScript ensures this is never reached
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}

// ✅ Good: Prefer nullish coalescing
const budget = trip.budget ?? 0;
const title = trip.title ?? 'Untitled Trip';

// ❌ Bad: Using logical OR with falsy values
const budget = trip.budget || 0; // Would convert 0 to 0, but intent unclear
```

## Prettier Configuration

### Formatting Rules
```javascript
// prettier.config.js
module.exports = {
  // Line length
  printWidth: 80,
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Strings
  singleQuote: false,
  quoteProps: 'as-needed',
  
  // Punctuation
  semi: true,
  trailingComma: 'es5',
  
  // Spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Functions
  arrowParens: 'always',
  
  // Imports
  importOrder: [
    '^react',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '^@tripthesia/(.*)$',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
```

### Code Formatting Examples
```typescript
// ✅ Good: Consistent formatting
const createTripMutation = useMutation({
  mutationFn: async (params: CreateTripParams) => {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create trip');
    }
    
    return response.json() as Promise<Trip>;
  },
  onSuccess: (trip) => {
    router.push(`/trip/${trip.id}`);
  },
  onError: (error) => {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  },
});

// ✅ Good: Multi-line object formatting
const tripWizardSchema = z.object({
  destinations: z
    .array(
      z.object({
        city: z.string().min(1, 'City is required'),
        country: z.string().min(1, 'Country is required'),
        lat: z.number(),
        lng: z.number(),
      })
    )
    .min(1, 'At least one destination is required'),
  startDate: z.date(),
  endDate: z.date(),
  tripType: z.enum(['business', 'leisure', 'adventure', 'research']),
  budget: z.number().min(0).optional(),
});
```

## React Component Standards

### Component Structure
```typescript
// ✅ Good: Component file structure
import React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types first
interface TripCardProps {
  trip: Trip;
  onEdit?: (trip: Trip) => void;
  onDelete?: (tripId: string) => void;
  className?: string;
}

// Component with proper TypeScript
export function TripCard({ 
  trip, 
  onEdit, 
  onDelete, 
  className 
}: TripCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit(trip);
    }
  };
  
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (onDelete) {
        await onDelete(trip.id);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <CardTitle>{trip.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {trip.destinations.length} destination
            {trip.destinations.length !== 1 ? 's' : ''}
          </span>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Hooks Standards
```typescript
// ✅ Good: Custom hook structure
export function useTripGeneration() {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const generateTrip = useCallback(async (params: GenerateTripParams) => {
    setStatus('generating');
    setProgress(0);
    setError(null);
    
    try {
      const eventSource = new EventSource(`/api/trips/${params.tripId}/generate`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setProgress(data.progress);
        } else if (data.type === 'complete') {
          setStatus('success');
          eventSource.close();
        }
      };
      
      eventSource.onerror = () => {
        setStatus('error');
        setError('Generation failed');
        eventSource.close();
      };
      
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);
  
  return {
    status,
    progress,
    error,
    generateTrip,
    isGenerating: status === 'generating',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
```

## File Organization

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── forms/          # Form-specific components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   ├── db.ts          # Database connection
│   ├── auth.ts        # Authentication helpers
│   ├── utils.ts       # General utilities
│   └── validations.ts # Zod schemas
├── types/              # Type definitions
│   ├── api.ts         # API types
│   ├── database.ts    # Database types
│   └── global.d.ts    # Global type declarations
└── app/                # Next.js App Router
    ├── (auth)/         # Route groups
    ├── api/           # API routes
    └── globals.css    # Global styles
```

### Import Order
```typescript
// ✅ Good: Consistent import order
// 1. React imports
import React from 'react';
import { useState, useEffect } from 'react';

// 2. Next.js imports  
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 3. Third-party libraries
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

// 4. Internal packages
import { Button } from '@tripthesia/ui';

// 5. Local imports (absolute)
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 6. Local imports (relative)
import { TripCard } from './trip-card';
import './styles.css';
```

### File Naming
```
// ✅ Good: Consistent naming
components/
├── trip-wizard.tsx        # kebab-case for files
├── activity-card.tsx
└── ui/
    ├── button.tsx
    └── card.tsx

hooks/
├── use-trip-generation.ts # kebab-case with use- prefix
├── use-auth.ts
└── use-local-storage.ts

lib/
├── db.ts                  # lowercase
├── auth-utils.ts          # descriptive names
└── api-client.ts

types/
├── trip.ts               # singular names
├── user.ts
└── api-responses.ts      # descriptive for complex types
```

## CSS & Styling Standards

### Tailwind Usage
```typescript
// ✅ Good: Semantic class grouping
<div className={cn(
  // Layout
  "flex items-center justify-between",
  // Spacing
  "p-4 mx-auto",
  // Appearance
  "bg-white rounded-lg shadow-md",
  // Interactive
  "hover:shadow-lg transition-shadow",
  // Responsive
  "md:p-6 lg:p-8",
  // Conditional
  isActive && "ring-2 ring-primary",
  className
)}>
```

### Component Variants
```typescript
// ✅ Good: Using CVA for variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## API Standards

### Route Handler Structure
```typescript
// ✅ Good: API route structure
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

import { db } from '@/lib/db';
import { ratelimit } from '@/lib/rate-limit';

// Input validation schema
const createTripSchema = z.object({
  title: z.string().min(1).max(160),
  destinations: z.array(z.object({
    city: z.string(),
    country: z.string(),
    lat: z.number(),
    lng: z.number(),
  })).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tripType: z.enum(['business', 'leisure', 'adventure', 'research']),
  budget: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Rate limiting
    const { success } = await ratelimit.limit(userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' }, 
        { status: 429 }
      );
    }

    // Input validation
    const body = await req.json();
    const validatedData = createTripSchema.parse(body);

    // Business logic
    const trip = await db.transaction(async (tx) => {
      const [newTrip] = await tx.insert(trips).values({
        userId,
        ...validatedData,
      }).returning();
      
      return newTrip;
    });

    return NextResponse.json(trip, { status: 201 });
    
  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create trip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling
```typescript
// ✅ Good: Consistent error responses
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code 
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: error.errors 
      },
      { status: 400 }
    );
  }
  
  console.error('Unhandled API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Git Standards

### Commit Message Convention
```
type(scope): subject

body

footer
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples
```bash
# ✅ Good commit messages
feat(trip-wizard): add multi-destination support

Allow users to add multiple destinations in the trip wizard.
Includes validation for minimum 1 destination and maximum 5
destinations per trip.

Closes #123

fix(auth): resolve session timeout issue

Users were being logged out unexpectedly due to incorrect
token refresh logic. Updated token refresh to happen 5 minutes
before expiry instead of after.

Fixes #456

docs(api): update trip creation endpoint documentation

Added examples for multi-destination trips and error responses.
Updated parameter descriptions for clarity.

# ❌ Bad commit messages
fix stuff
added feature
WIP
update
```

### Branch Naming
```bash
# ✅ Good branch names
feature/trip-collaboration
fix/payment-webhook-error
docs/api-documentation
refactor/database-queries

# ❌ Bad branch names
my-feature
temp
fix
update-stuff
```

## Code Review Guidelines

### Review Checklist
- [ ] Code follows TypeScript strict mode
- [ ] All functions have proper type annotations
- [ ] Error handling is comprehensive
- [ ] Tests are included for new functionality
- [ ] Documentation is updated
- [ ] Performance implications considered
- [ ] Security implications reviewed
- [ ] Accessibility requirements met

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```