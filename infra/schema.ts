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
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(), // Clerk user id
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  userId: varchar("user_id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 120 }),
  homeAirport: varchar("home_airport", { length: 8 }),
  budgetBand: varchar("budget_band", { length: 16 }), // low/med/high
  pace: varchar("pace", { length: 16 }), // chill/standard/packed
  mobility: varchar("mobility", { length: 16 }), // walk/public/car
  preferences: jsonb("preferences"), // cuisine, dietary, must/avoid
  
  // Subscription fields (Razorpay-based)
  subscriptionTier: varchar("subscription_tier", { length: 16 }).default("free"), // free/pro/enterprise
  subscriptionStatus: varchar("subscription_status", { length: 24 }), // active/cancelled/expired/paused
  subscriptionId: varchar("subscription_id", { length: 64 }), // Razorpay subscription ID
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 64 }), // Razorpay customer ID
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  
  // Legacy fields (kept for migration compatibility)
  pro: boolean("pro").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 160 }),
  destinations: jsonb("destinations").notNull(), // [{city, country, lat, lng}]
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  tripType: varchar("trip_type", { length: 24 }).notNull(), // business/trek/research/mixed
  budgetTotal: integer("budget_total"),
  budgetSplit: jsonb("budget_split"), // {transport, lodging, food, activities}
  status: varchar("status", { length: 24 }).default("draft"),
  sharedToken: varchar("shared_token", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  tripId: uuid("trip_id").notNull(),
  version: integer("version").default(1),
  data: jsonb("data").notNull(), // structured Itinerary JSON
  locks: jsonb("locks"), // ids locked by user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sharedTrips = pgTable("shared_trips", {
  id: varchar("id", { length: 16 }).primaryKey(), // Share token
  tripId: uuid("trip_id").notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  isPublic: boolean("is_public").default(false),
  allowComments: boolean("allow_comments").default(false),
  permissions: jsonb("permissions").notNull().default(['view']), // ['view', 'comment', 'edit']
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const places = pgTable("places", {
  id: varchar("id", { length: 64 }).primaryKey(), // canonical place id (fsq:xxx or otm:xxx)
  source: varchar("source", { length: 16 }).notNull().default("manual"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  category: varchar("category", { length: 80 }),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  priceLevel: integer("price_level"), // 1-4 scale
  coords: sql`GEOGRAPHY(POINT, 4326)`, // PostGIS - format: POINT(lng lat)
  photoUrl: text("photo_url"),
  website: text("website"),
  hours: text("hours"), // Simple text format for now
  tags: jsonb("tags").$type<string[]>().default([]),
  verified: boolean("verified").default(false),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceQuotes = pgTable("price_quotes", {
  id: serial("id").primaryKey(),
  tripId: uuid("trip_id").notNull(),
  itemType: varchar("item_type", { length: 24 }).notNull(), // flight/hotel/activity/car
  itemRef: jsonb("item_ref").notNull(), // supplier id, place id
  currency: varchar("currency", { length: 8 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  url: text("url"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 24 }).notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types for inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type Itinerary = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;

export type SharedTrip = typeof sharedTrips.$inferSelect;
export type NewSharedTrip = typeof sharedTrips.$inferInsert;

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

export type PriceQuote = typeof priceQuotes.$inferSelect;
export type NewPriceQuote = typeof priceQuotes.$inferInsert;

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;