import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  boolean,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";

// Users table (managed by Clerk)
export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User profiles with subscription info
export const profiles = pgTable("profiles", {
  userId: varchar("user_id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 120 }),
  homeAirport: varchar("home_airport", { length: 8 }),
  budgetBand: varchar("budget_band", { length: 16 }), // low/med/high
  pace: varchar("pace", { length: 16 }), // chill/standard/packed
  mobility: varchar("mobility", { length: 16 }), // walk/public/car
  preferences: jsonb("preferences"), // cuisine, dietary, must/avoid
  
  // Subscription fields (Razorpay)
  subscriptionTier: varchar("subscription_tier", { length: 16 }).default("free"), // free/starter/pro
  subscriptionStatus: varchar("subscription_status", { length: 24 }), // active/cancelled/expired/paused
  subscriptionId: varchar("subscription_id", { length: 64 }), // Razorpay subscription ID
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 64 }),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  
  // Usage tracking
  tripsUsedThisMonth: integer("trips_used_this_month").default(0),
  lastTripCreated: timestamp("last_trip_created"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Trips table
export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 160 }),
  destinations: jsonb("destinations").notNull(), // [{city, country, lat, lng}]
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  tripType: varchar("trip_type", { length: 24 }).notNull(), // leisure/business/adventure/cultural
  budgetTotal: integer("budget_total"), // in rupees/dollars
  budgetCurrency: varchar("budget_currency", { length: 3 }).default("INR"),
  budgetSplit: jsonb("budget_split"), // {transport, lodging, food, activities}
  status: varchar("status", { length: 24 }).default("draft"), // draft/generated/shared
  sharedToken: varchar("shared_token", { length: 64 }),
  generationStatus: varchar("generation_status", { length: 24 }).default("pending"), // pending/generating/completed/failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Generated itineraries
export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  tripId: uuid("trip_id").notNull(),
  version: integer("version").default(1),
  data: jsonb("data").notNull(), // Full itinerary JSON
  locks: jsonb("locks"), // User-locked items
  aiPrompt: text("ai_prompt"), // Original prompt sent to AI
  aiModel: varchar("ai_model", { length: 32 }), // gpt-4o-mini, etc.
  generationTime: integer("generation_time"), // Time taken in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Places cache for fast lookups
export const places = pgTable("places", {
  id: varchar("id", { length: 64 }).primaryKey(), // fsq:xxx or custom
  source: varchar("source", { length: 16 }).notNull().default("foursquare"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  category: varchar("category", { length: 80 }),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  priceLevel: integer("price_level"), // 1-4 scale
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 11, scale: 8 }),
  photoUrl: text("photo_url"),
  website: text("website"),
  hours: jsonb("hours"), // Opening hours
  tags: jsonb("tags").$type<string[]>().default([]),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Price quotes cache
export const priceQuotes = pgTable("price_quotes", {
  id: serial("id").primaryKey(),
  tripId: uuid("trip_id").notNull(),
  itemType: varchar("item_type", { length: 24 }).notNull(), // flight/hotel/activity
  itemRef: jsonb("item_ref").notNull(), // reference data
  currency: varchar("currency", { length: 8 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  provider: varchar("provider", { length: 32 }), // mock/foursquare/etc
  deepLink: text("deep_link"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Shared trips
export const sharedTrips = pgTable("shared_trips", {
  id: varchar("id", { length: 16 }).primaryKey(), // Share token
  tripId: uuid("trip_id").notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  isPublic: boolean("is_public").default(false),
  allowComments: boolean("allow_comments").default(false),
  permissions: jsonb("permissions").notNull().default(['view']),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Webhooks log
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 24 }).notNull(), // razorpay/clerk
  eventType: varchar("event_type", { length: 64 }),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage analytics
export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }),
  eventType: varchar("event_type", { length: 32 }).notNull(), // trip_created/ai_generated/etc
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Itinerary = typeof itineraries.$inferSelect;
export type Place = typeof places.$inferSelect;
export type PriceQuote = typeof priceQuotes.$inferSelect;
export type SharedTrip = typeof sharedTrips.$inferSelect;