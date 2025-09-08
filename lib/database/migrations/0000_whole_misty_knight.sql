DO $$ BEGIN
 CREATE TYPE "budget_band" AS ENUM('low', 'med', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "budget_currency" AS ENUM('INR', 'USD', 'EUR', 'GBP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "feedback_type" AS ENUM('rating', 'thumbs', 'detailed', 'implicit', 'behavioral');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "generation_status" AS ENUM('pending', 'generating', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "interaction_type" AS ENUM('search', 'view', 'like', 'dislike', 'book', 'share', 'save', 'skip', 'time_spent', 'click_through', 'comparison', 'filter_apply');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "learning_source" AS ENUM('explicit_input', 'implicit_behavior', 'feedback_analysis', 'collaborative_filtering', 'content_analysis', 'seasonal_pattern', 'booking_history');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mobility" AS ENUM('walk', 'public', 'car');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "pace" AS ENUM('chill', 'standard', 'packed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "preference_type" AS ENUM('destination_category', 'activity_type', 'accommodation_style', 'cuisine_preference', 'budget_range', 'trip_pace', 'transport_mode', 'travel_style', 'seasonal_preference', 'group_composition', 'accessibility_need', 'cultural_interest');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_status" AS ENUM('active', 'cancelled', 'expired', 'paused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_tier" AS ENUM('free', 'starter', 'pro');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trip_status" AS ENUM('draft', 'generated', 'shared', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trip_type" AS ENUM('leisure', 'business', 'adventure', 'cultural');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "draft_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"current_step" varchar(24) DEFAULT 'destination' NOT NULL,
	"completed_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"form_data" jsonb NOT NULL,
	"step_data" jsonb,
	"title" varchar(160),
	"last_saved" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itineraries" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"version" integer DEFAULT 1,
	"data" jsonb NOT NULL,
	"locks" jsonb,
	"ai_prompt" text,
	"ai_model" varchar(32),
	"generation_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personalized_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"recommendation_type" varchar(32) NOT NULL,
	"context_hash" varchar(64) NOT NULL,
	"recommendations" jsonb NOT NULL,
	"confidence_scores" jsonb,
	"generation_algorithm" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "places" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"source" varchar(16) DEFAULT 'foursquare' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"address" text,
	"city" varchar(100),
	"country" varchar(100),
	"category" varchar(80),
	"rating" numeric(3, 2),
	"price_level" integer,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"photo_url" text,
	"website" text,
	"hours" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"item_type" varchar(24) NOT NULL,
	"item_ref" jsonb NOT NULL,
	"currency" varchar(8) NOT NULL,
	"amount" numeric(12, 2),
	"provider" varchar(32),
	"deep_link" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(120),
	"home_airport" varchar(8),
	"budget_band" "budget_band",
	"pace" "pace",
	"mobility" "mobility",
	"preferences" jsonb,
	"subscription_tier" "subscription_tier" DEFAULT 'free',
	"subscription_status" "subscription_status",
	"subscription_id" varchar(64),
	"razorpay_customer_id" varchar(64),
	"subscription_current_period_end" timestamp,
	"trips_used_this_month" integer DEFAULT 0 NOT NULL,
	"last_trip_created" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"recommendation_id" varchar(64) NOT NULL,
	"recommendation_type" varchar(32) NOT NULL,
	"feedback_type" "feedback_type" NOT NULL,
	"feedback_value" numeric(5, 2) NOT NULL,
	"feedback_text" text,
	"context_data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_trips" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"created_by" varchar(64) NOT NULL,
	"is_public" boolean DEFAULT false,
	"allow_comments" boolean DEFAULT false,
	"permissions" jsonb DEFAULT '["view"]'::jsonb NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"title" varchar(160) NOT NULL,
	"destinations" jsonb NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"trip_type" "trip_type" NOT NULL,
	"budget_total" integer,
	"budget_currency" "budget_currency" DEFAULT 'INR' NOT NULL,
	"budget_split" jsonb,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"shared_token" varchar(64),
	"generation_status" "generation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64),
	"event_type" varchar(32) NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_clusters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"cluster_id" varchar(64) NOT NULL,
	"cluster_name" varchar(128),
	"similarity_score" numeric(5, 4) NOT NULL,
	"cluster_characteristics" jsonb NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"interaction_type" "interaction_type" NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"target_id" varchar(64) NOT NULL,
	"interaction_value" numeric(5, 2),
	"context_data" jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"preference_type" "preference_type" NOT NULL,
	"preference_value" varchar(255) NOT NULL,
	"preference_weight" numeric(3, 2) DEFAULT '1.0' NOT NULL,
	"confidence_score" numeric(3, 2) DEFAULT '0.5' NOT NULL,
	"learning_source" "learning_source" NOT NULL,
	"context_data" jsonb,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(24) NOT NULL,
	"event_type" varchar(64),
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draft_trips_user_id_idx" ON "draft_trips" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draft_trips_last_saved_idx" ON "draft_trips" ("last_saved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draft_trips_current_step_idx" ON "draft_trips" ("current_step");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "draft_trips_created_at_idx" ON "draft_trips" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "itineraries_trip_id_idx" ON "itineraries" ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "itineraries_created_at_idx" ON "itineraries" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unique_personalized_rec_idx" ON "personalized_recommendations" ("user_id","recommendation_type","context_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personalized_recommendations_user_id_idx" ON "personalized_recommendations" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personalized_recommendations_type_idx" ON "personalized_recommendations" ("recommendation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personalized_recommendations_expires_idx" ON "personalized_recommendations" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personalized_recommendations_created_at_idx" ON "personalized_recommendations" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "places_city_country_idx" ON "places" ("city","country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "places_category_idx" ON "places" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "places_location_idx" ON "places" ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "places_verified_idx" ON "places" ("verified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "places_source_idx" ON "places" ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_quotes_trip_id_idx" ON "price_quotes" ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_quotes_item_type_idx" ON "price_quotes" ("item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_quotes_expires_at_idx" ON "price_quotes" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_user_id_idx" ON "profiles" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_subscription_tier_idx" ON "profiles" ("subscription_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_updated_at_idx" ON "profiles" ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unique_recommendation_feedback_idx" ON "recommendation_feedback" ("user_id","recommendation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recommendation_feedback_user_id_idx" ON "recommendation_feedback" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recommendation_feedback_rec_id_idx" ON "recommendation_feedback" ("recommendation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recommendation_feedback_type_idx" ON "recommendation_feedback" ("feedback_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recommendation_feedback_timestamp_idx" ON "recommendation_feedback" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shared_trips_trip_id_idx" ON "shared_trips" ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shared_trips_created_by_idx" ON "shared_trips" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shared_trips_expires_at_idx" ON "shared_trips" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_user_id_idx" ON "trips" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_status_idx" ON "trips" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_created_at_idx" ON "trips" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_start_date_idx" ON "trips" ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_shared_token_idx" ON "trips" ("shared_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_user_id_idx" ON "usage_events" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_event_type_idx" ON "usage_events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_created_at_idx" ON "usage_events" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unique_user_cluster_idx" ON "user_clusters" ("user_id","cluster_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_clusters_user_id_idx" ON "user_clusters" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_clusters_cluster_id_idx" ON "user_clusters" ("cluster_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_clusters_similarity_idx" ON "user_clusters" ("similarity_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_clusters_updated_at_idx" ON "user_clusters" ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_user_id_idx" ON "user_interactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_session_idx" ON "user_interactions" ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_type_idx" ON "user_interactions" ("interaction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_target_type_idx" ON "user_interactions" ("target_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_timestamp_idx" ON "user_interactions" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_user_time_idx" ON "user_interactions" ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_interactions_type_target_idx" ON "user_interactions" ("interaction_type","target_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unique_user_preference_idx" ON "user_preferences" ("user_id","preference_type","preference_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_preferences_user_id_idx" ON "user_preferences" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_preferences_type_idx" ON "user_preferences" ("preference_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_preferences_confidence_idx" ON "user_preferences" ("confidence_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_preferences_updated_at_idx" ON "user_preferences" ("updated_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "draft_trips" ADD CONSTRAINT "draft_trips_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personalized_recommendations" ADD CONSTRAINT "personalized_recommendations_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_quotes" ADD CONSTRAINT "price_quotes_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_trips" ADD CONSTRAINT "shared_trips_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_trips" ADD CONSTRAINT "shared_trips_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_clusters" ADD CONSTRAINT "user_clusters_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
