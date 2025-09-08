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
  check,
  foreignKey,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enum definitions for better type safety and constraints
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'starter', 'pro']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'expired', 'paused']);
export const tripTypeEnum = pgEnum('trip_type', ['leisure', 'business', 'adventure', 'cultural']);
export const budgetCurrencyEnum = pgEnum('budget_currency', ['INR', 'USD', 'EUR', 'GBP']);
export const tripStatusEnum = pgEnum('trip_status', ['draft', 'generated', 'shared', 'archived']);
export const generationStatusEnum = pgEnum('generation_status', ['pending', 'generating', 'completed', 'failed']);
export const budgetBandEnum = pgEnum('budget_band', ['low', 'med', 'high']);
export const paceEnum = pgEnum('pace', ['chill', 'standard', 'packed']);
export const mobilityEnum = pgEnum('mobility', ['walk', 'public', 'car']);

// Personalization enums for Phase 4.3
export const preferenceTypeEnum = pgEnum('preference_type', [
  'destination_category', 'activity_type', 'accommodation_style', 'cuisine_preference', 
  'budget_range', 'trip_pace', 'transport_mode', 'travel_style', 'seasonal_preference',
  'group_composition', 'accessibility_need', 'cultural_interest'
]);
export const interactionTypeEnum = pgEnum('interaction_type', [
  'search', 'view', 'like', 'dislike', 'book', 'share', 'save', 'skip', 
  'time_spent', 'click_through', 'comparison', 'filter_apply'
]);
export const feedbackTypeEnum = pgEnum('feedback_type', [
  'rating', 'thumbs', 'detailed', 'implicit', 'behavioral'
]);
export const learningSourceEnum = pgEnum('learning_source', [
  'explicit_input', 'implicit_behavior', 'feedback_analysis', 'collaborative_filtering', 
  'content_analysis', 'seasonal_pattern', 'booking_history'
]);

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
  budgetBand: budgetBandEnum("budget_band"),
  pace: paceEnum("pace"),
  mobility: mobilityEnum("mobility"),
  preferences: jsonb("preferences"), // cuisine, dietary, must/avoid
  
  // Subscription fields (Razorpay)
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  subscriptionId: varchar("subscription_id", { length: 64 }), // Razorpay subscription ID
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 64 }),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  
  // Usage tracking
  tripsUsedThisMonth: integer("trips_used_this_month").default(0).notNull(),
  lastTripCreated: timestamp("last_trip_created"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "profiles_user_id_fk"
  }),
  // Check constraints
  tripsUsedCheck: check("trips_used_check", sql`trips_used_this_month >= 0`),
  // Indexes for performance
  userIdIdx: index("profiles_user_id_idx").on(table.userId),
  subscriptionTierIdx: index("profiles_subscription_tier_idx").on(table.subscriptionTier),
  updatedAtIdx: index("profiles_updated_at_idx").on(table.updatedAt),
}));

// Trips table
export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  destinations: jsonb("destinations").notNull(), // [{city, country, lat, lng}]
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  tripType: tripTypeEnum("trip_type").notNull(),
  budgetTotal: integer("budget_total"),
  budgetCurrency: budgetCurrencyEnum("budget_currency").default("INR").notNull(),
  budgetSplit: jsonb("budget_split"), // {transport, lodging, food, activities}
  status: tripStatusEnum("status").default("draft").notNull(),
  sharedToken: varchar("shared_token", { length: 64 }),
  generationStatus: generationStatusEnum("generation_status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "trips_user_id_fk"
  }),
  // Check constraints
  budgetCheck: check("budget_check", sql`budget_total IS NULL OR budget_total > 0`),
  dateCheck: check("date_check", sql`end_date > start_date`),
  titleCheck: check("title_check", sql`LENGTH(title) > 0`),
  // Indexes for performance
  userIdIdx: index("trips_user_id_idx").on(table.userId),
  statusIdx: index("trips_status_idx").on(table.status),
  createdAtIdx: index("trips_created_at_idx").on(table.createdAt),
  startDateIdx: index("trips_start_date_idx").on(table.startDate),
  sharedTokenIdx: index("trips_shared_token_idx").on(table.sharedToken),
}));

// Draft trips for step-by-step progress saving
export const draftTrips = pgTable("draft_trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  currentStep: varchar("current_step", { length: 24 }).default("destination").notNull(),
  completedSteps: jsonb("completed_steps").$type<string[]>().default([]).notNull(),
  formData: jsonb("form_data").notNull(), // Complete form data from all steps
  stepData: jsonb("step_data"), // Step-specific data (transport selections, etc.)
  title: varchar("title", { length: 160 }), // Optional user-provided title
  lastSaved: timestamp("last_saved").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "draft_trips_user_id_fk"
  }),
  // Check constraints
  currentStepCheck: check("current_step_check", sql`current_step IN ('destination', 'transport', 'rental', 'accommodation', 'activities', 'dining')`),
  titleCheck: check("title_check", sql`title IS NULL OR LENGTH(title) > 0`),
  // Indexes for performance
  userIdIdx: index("draft_trips_user_id_idx").on(table.userId),
  lastSavedIdx: index("draft_trips_last_saved_idx").on(table.lastSaved),
  currentStepIdx: index("draft_trips_current_step_idx").on(table.currentStep),
  createdAtIdx: index("draft_trips_created_at_idx").on(table.createdAt),
}));

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
}, (table) => ({
  // Foreign key to trips table
  tripIdFk: foreignKey({
    columns: [table.tripId],
    foreignColumns: [trips.id],
    name: "itineraries_trip_id_fk"
  }),
  // Check constraints
  versionCheck: check("version_check", sql`version >= 1`),
  generationTimeCheck: check("generation_time_check", sql`generation_time IS NULL OR generation_time >= 0`),
  // Indexes for performance
  tripIdIdx: index("itineraries_trip_id_idx").on(table.tripId),
  createdAtIdx: index("itineraries_created_at_idx").on(table.createdAt),
}));

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
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Check constraints
  priceLevelCheck: check("price_level_check", sql`price_level IS NULL OR (price_level >= 1 AND price_level <= 4)`),
  ratingCheck: check("rating_check", sql`rating IS NULL OR (rating >= 0 AND rating <= 5)`),
  latitudeCheck: check("latitude_check", sql`latitude IS NULL OR (latitude >= -90 AND latitude <= 90)`),
  longitudeCheck: check("longitude_check", sql`longitude IS NULL OR (longitude >= -180 AND longitude <= 180)`),
  nameCheck: check("name_check", sql`LENGTH(name) > 0`),
  // Indexes for performance
  cityCountryIdx: index("places_city_country_idx").on(table.city, table.country),
  categoryIdx: index("places_category_idx").on(table.category),
  locationIdx: index("places_location_idx").on(table.latitude, table.longitude),
  verifiedIdx: index("places_verified_idx").on(table.verified),
  sourceIdx: index("places_source_idx").on(table.source),
}));

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
}, (table) => ({
  // Foreign key to trips table
  tripIdFk: foreignKey({
    columns: [table.tripId],
    foreignColumns: [trips.id],
    name: "price_quotes_trip_id_fk"
  }),
  // Check constraints
  amountCheck: check("amount_check", sql`amount IS NULL OR amount >= 0`),
  itemTypeCheck: check("item_type_check", sql`item_type IN ('flight', 'hotel', 'activity', 'transport')`),
  // Indexes for performance
  tripIdIdx: index("price_quotes_trip_id_idx").on(table.tripId),
  itemTypeIdx: index("price_quotes_item_type_idx").on(table.itemType),
  expiresAtIdx: index("price_quotes_expires_at_idx").on(table.expiresAt),
}));

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
}, (table) => ({
  // Foreign keys
  tripIdFk: foreignKey({
    columns: [table.tripId],
    foreignColumns: [trips.id],
    name: "shared_trips_trip_id_fk"
  }),
  createdByFk: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: "shared_trips_created_by_fk"
  }),
  // Indexes for performance
  tripIdIdx: index("shared_trips_trip_id_idx").on(table.tripId),
  createdByIdx: index("shared_trips_created_by_idx").on(table.createdBy),
  expiresAtIdx: index("shared_trips_expires_at_idx").on(table.expiresAt),
}));

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
}, (table) => ({
  // Foreign key to users table (nullable for anonymous events)
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "usage_events_user_id_fk"
  }),
  // Check constraints
  eventTypeCheck: check("event_type_check", sql`LENGTH(event_type) > 0`),
  // Indexes for performance
  userIdIdx: index("usage_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("usage_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("usage_events_created_at_idx").on(table.createdAt),
}));

// ==================== PERSONALIZATION TABLES - PHASE 4.3 ====================

// User preference profiles for personalized recommendations
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  preferenceType: preferenceTypeEnum("preference_type").notNull(),
  preferenceValue: varchar("preference_value", { length: 255 }).notNull(),
  preferenceWeight: numeric("preference_weight", { precision: 3, scale: 2 }).default("1.0").notNull(),
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }).default("0.5").notNull(),
  learningSource: learningSourceEnum("learning_source").notNull(),
  contextData: jsonb("context_data"), // Additional context about when/how preference was learned
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validUntil: timestamp("valid_until"), // For time-sensitive preferences
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "user_preferences_user_id_fk"
  }),
  // Unique constraint to prevent duplicate preferences
  uniqueUserPreference: index("unique_user_preference_idx").on(table.userId, table.preferenceType, table.preferenceValue),
  // Check constraints
  weightCheck: check("preference_weight_check", sql`preference_weight >= 0 AND preference_weight <= 10`),
  confidenceCheck: check("confidence_score_check", sql`confidence_score >= 0 AND confidence_score <= 1`),
  // Indexes for performance
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
  preferenceTypeIdx: index("user_preferences_type_idx").on(table.preferenceType),
  confidenceIdx: index("user_preferences_confidence_idx").on(table.confidenceScore),
  updatedAtIdx: index("user_preferences_updated_at_idx").on(table.updatedAt),
}));

// User interaction tracking for behavioral analysis
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  interactionType: interactionTypeEnum("interaction_type").notNull(),
  targetType: varchar("target_type", { length: 32 }).notNull(), // 'destination', 'activity', 'hotel', 'flight'
  targetId: varchar("target_id", { length: 64 }).notNull(),
  interactionValue: numeric("interaction_value", { precision: 5, scale: 2 }), // time_spent, rating, etc.
  contextData: jsonb("context_data").notNull(), // search params, page context, user agent, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "user_interactions_user_id_fk"
  }),
  // Indexes for performance and analytics
  userIdIdx: index("user_interactions_user_id_idx").on(table.userId),
  sessionIdIdx: index("user_interactions_session_idx").on(table.sessionId),
  interactionTypeIdx: index("user_interactions_type_idx").on(table.interactionType),
  targetTypeIdx: index("user_interactions_target_type_idx").on(table.targetType),
  timestampIdx: index("user_interactions_timestamp_idx").on(table.timestamp),
  // Composite indexes for common queries
  userTimeIdx: index("user_interactions_user_time_idx").on(table.userId, table.timestamp),
  typeTargetIdx: index("user_interactions_type_target_idx").on(table.interactionType, table.targetType),
}));

// Recommendation feedback for continuous learning
export const recommendationFeedback = pgTable("recommendation_feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  recommendationId: varchar("recommendation_id", { length: 64 }).notNull(),
  recommendationType: varchar("recommendation_type", { length: 32 }).notNull(),
  feedbackType: feedbackTypeEnum("feedback_type").notNull(),
  feedbackValue: numeric("feedback_value", { precision: 5, scale: 2 }).notNull(),
  feedbackText: text("feedback_text"), // Optional detailed feedback
  contextData: jsonb("context_data"), // When/where feedback was given
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "recommendation_feedback_user_id_fk"
  }),
  // Unique constraint to prevent duplicate feedback
  uniqueFeedback: index("unique_recommendation_feedback_idx").on(table.userId, table.recommendationId),
  // Check constraints
  feedbackValueCheck: check("feedback_value_check", sql`feedback_value >= -10 AND feedback_value <= 10`),
  // Indexes for performance
  userIdIdx: index("recommendation_feedback_user_id_idx").on(table.userId),
  recommendationIdIdx: index("recommendation_feedback_rec_id_idx").on(table.recommendationId),
  feedbackTypeIdx: index("recommendation_feedback_type_idx").on(table.feedbackType),
  timestampIdx: index("recommendation_feedback_timestamp_idx").on(table.timestamp),
}));

// User similarity clusters for collaborative filtering
export const userClusters = pgTable("user_clusters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  clusterId: varchar("cluster_id", { length: 64 }).notNull(),
  clusterName: varchar("cluster_name", { length: 128 }),
  similarityScore: numeric("similarity_score", { precision: 5, scale: 4 }).notNull(),
  clusterCharacteristics: jsonb("cluster_characteristics").notNull(),
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "user_clusters_user_id_fk"
  }),
  // Unique constraint for user-cluster pairs
  uniqueUserCluster: index("unique_user_cluster_idx").on(table.userId, table.clusterId),
  // Check constraints
  similarityCheck: check("similarity_score_check", sql`similarity_score >= 0 AND similarity_score <= 1`),
  // Indexes for performance
  userIdIdx: index("user_clusters_user_id_idx").on(table.userId),
  clusterIdIdx: index("user_clusters_cluster_id_idx").on(table.clusterId),
  similarityIdx: index("user_clusters_similarity_idx").on(table.similarityScore),
  updatedAtIdx: index("user_clusters_updated_at_idx").on(table.updatedAt),
}));

// Personalized recommendation cache for performance
export const personalizedRecommendations = pgTable("personalized_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  recommendationType: varchar("recommendation_type", { length: 32 }).notNull(),
  contextHash: varchar("context_hash", { length: 64 }).notNull(), // Hash of request context
  recommendations: jsonb("recommendations").notNull(),
  confidenceScores: jsonb("confidence_scores"), // Individual confidence scores
  generationAlgorithm: varchar("generation_algorithm", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Foreign key to users table
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "personalized_recommendations_user_id_fk"
  }),
  // Unique constraint for caching
  uniqueRecommendation: index("unique_personalized_rec_idx").on(table.userId, table.recommendationType, table.contextHash),
  // Indexes for performance
  userIdIdx: index("personalized_recommendations_user_id_idx").on(table.userId),
  typeIdx: index("personalized_recommendations_type_idx").on(table.recommendationType),
  expiresAtIdx: index("personalized_recommendations_expires_idx").on(table.expiresAt),
  createdAtIdx: index("personalized_recommendations_created_at_idx").on(table.createdAt),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type DraftTrip = typeof draftTrips.$inferSelect;
export type Itinerary = typeof itineraries.$inferSelect;
export type Place = typeof places.$inferSelect;
export type PriceQuote = typeof priceQuotes.$inferSelect;
export type SharedTrip = typeof sharedTrips.$inferSelect;

// Personalization type exports - Phase 4.3
export type UserPreference = typeof userPreferences.$inferSelect;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type RecommendationFeedback = typeof recommendationFeedback.$inferSelect;
export type UserCluster = typeof userClusters.$inferSelect;
export type PersonalizedRecommendation = typeof personalizedRecommendations.$inferSelect;