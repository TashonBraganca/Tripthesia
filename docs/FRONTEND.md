# Frontend Documentation

## Overview
The frontend is built with Next.js 14 App Router, React 18, TypeScript, and TailwindCSS, focusing on performance, accessibility, and user experience.

## Pages Structure

### Landing Page (/)
- **Purpose**: Marketing homepage with hero, features, and CTA
- **Components**: Hero, HowItWorks, CityPacks, Footer
- **Features**:
  - Animated hero with gradient backgrounds
  - Interactive city pack cards
  - Responsive design
  - SEO optimized

### Trip Wizard (/new)
- **Purpose**: Multi-step form to collect trip requirements
- **Components**: TripWizard (stepper form)
- **Steps**:
  1. Destination(s) + Dates
  2. Trip type (business/trek/research/mixed)
  3. Budget + split allocation
  4. Mobility + pace preferences
  5. Must-visit/avoid preferences
  6. Lodging area preference
- **Validation**: Zod schemas with helpful error messages
- **UX**: Progress indicator, save draft, smart defaults

### Planner (/trip/[id])
- **Purpose**: Main itinerary editing interface
- **Layout**: Split view (timeline left, map right)
- **Components**:
  - `DayTimeline`: Drag/drop reorderable activity list
  - `MapSidebar`: Interactive Mapbox map
  - `DiscoverPanel`: Tabbed activity suggestions
  - `BudgetBar`: Real-time budget tracking
  - `LockToggle`: Lock/unlock activities
  - `ReflowButton`: Regenerate with constraints
- **Features**:
  - Real-time collaboration cursors
  - Streaming skeleton updates
  - Price chip loading states
  - Context menus ("Replace with similar")
  - Export/share dialogs

### Saved Trips (/saved)
- **Purpose**: User's trip library
- **Components**: SavedTrips (grid layout)
- **Features**:
  - Search and filter by city/date
  - Trip status indicators
  - Duplicate trip functionality
  - Bulk actions

### Billing (/billing)
- **Purpose**: Subscription management
- **Components**: BillingDashboard
- **Features**:
  - Current plan overview
  - Usage metrics
  - Stripe customer portal
  - Plan comparison

### Shared Trip (/s/[token])
- **Purpose**: Public read-only trip view
- **Components**: SharedTrip
- **Features**:
  - Public access (no auth required)
  - "Copy to my trips" CTA for signed-in users
  - Social sharing buttons
  - Print-friendly layout

## Component System

### Design System
- **Typography**: Inter (headings), JetBrains Mono (code)
- **Colors**: 
  - Primary: Emerald (500/600)
  - Secondary: Sky (500)
  - Accent: Amber (500)
  - Neutrals: Zinc scale
- **Spacing**: 4px base unit, consistent scale
- **Radii**: sm=6px, md=10px, lg=14px
- **Shadows**: Glass effect with subtle backdrop blur

### Core Components

#### UI Primitives (shadcn/ui based)
- `Button`: Multiple variants (default, outline, ghost, link)
- `Card`: Consistent content containers
- `Dialog/Drawer`: Modal interfaces
- `Tooltip`: Contextual help
- `Toast`: Notification system
- `Tabs`: Content organization
- `Select/Input`: Form controls

#### Domain Components
- `TripWizard`: Multi-step form with validation
- `DayTimeline`: Sortable activity timeline
- `PlaceCard`: POI display with booking
- `ActivityCard`: Itinerary activity item
- `PriceBadge`: Dynamic pricing display
- `WeatherChip`: Weather conditions
- `MapSidebar`: Interactive map interface
- `BudgetSlider`: Budget allocation control

### Interaction Patterns

#### Drag and Drop
- **Library**: @dnd-kit for accessibility
- **Features**:
  - Drag activities between days
  - Visual feedback during drag
  - Auto-scroll in containers
  - Keyboard navigation support
  - Touch support for mobile

#### Real-time Updates
- **Technology**: Server-Sent Events
- **Use Cases**:
  - Itinerary generation progress
  - Price updates
  - Collaboration cursors
  - System notifications

#### Progressive Enhancement
- **Skeleton Loading**: Show structure while loading
- **Optimistic Updates**: Immediate UI feedback
- **Error Boundaries**: Graceful error handling
- **Offline Support**: Basic functionality without network

### State Management

#### Global State (Zustand)
- Trip editing state
- UI preferences
- Collaboration state
- Cache management

#### Server State (TanStack Query)
- API data fetching
- Background refetching
- Optimistic updates
- Error retry logic

#### Form State (React Hook Form)
- Trip wizard forms
- Validation with Zod
- Multi-step form persistence
- Dynamic field dependencies

## Accessibility

### WCAG AA Compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Focus Management**: Logical tab order
- **Color Contrast**: Minimum 4.5:1 ratio
- **Text Scaling**: Support up to 200% zoom

### Accessibility Features
- Skip links for keyboard users
- High contrast mode support
- Reduced motion preferences
- Screen reader friendly drag/drop
- Voice control compatibility

## Internationalization

### Setup (next-intl)
- **Current**: English only
- **Prepared for**: Multi-language expansion
- **Features**:
  - RTL language support (dir attribute)
  - Date/number localization
  - Currency formatting
  - Pluralization rules

## Performance Optimization

### Core Web Vitals
- **LCP Target**: <2.5s (P75)
- **FID Target**: <100ms
- **CLS Target**: <0.1

### Optimization Strategies
- Next.js Image optimization
- Component lazy loading
- Route-based code splitting
- Service worker caching
- Bundle analysis and optimization

## Testing Strategy

### Unit Tests (Jest + Testing Library)
- Component behavior testing
- Hook testing
- Utility function testing
- Accessibility testing

### Integration Tests
- User flow testing
- API integration testing
- Form submission flows
- Error state handling

### E2E Tests (Playwright)
- Critical user journeys
- Cross-browser testing
- Mobile responsive testing
- Performance testing

## Development Workflow

### Local Development
```bash
pnpm dev          # Start development server
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript checking
pnpm test         # Run tests
```

### Code Quality
- **ESLint**: Strict rules with accessibility plugins
- **Prettier**: 80-character line width
- **Husky**: Pre-commit hooks
- **TypeScript**: Strict mode enabled

### Component Development
- Storybook for component documentation
- Visual regression testing
- Component API consistency
- Design system adherence