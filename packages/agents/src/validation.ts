import { z } from "zod";

export const PlaceRef = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  lat: z.number(),
  lng: z.number(),
  source: z.enum(["fsq", "otm", "google"]),
  hours: z
    .object({
      open: z.array(z.tuple([z.number(), z.number()])), // minutes from midnight
    })
    .optional(),
});

export const ActivityItem = z.object({
  id: z.string(),
  place: PlaceRef,
  start: z.string(), // ISO
  end: z.string(),
  kind: z.enum(["sight", "food", "bar", "nature", "business", "lodging", "transfer"]),
  locked: z.boolean().default(false),
  priceEstimate: z.number().nullable(),
  booking: z.object({ 
    url: z.string().url().optional(), 
    source: z.string().optional() 
  }).optional(),
});

export const DayPlan = z.object({
  date: z.string(),
  items: z.array(ActivityItem),
  notes: z.string().optional(),
  totalBudget: z.number().optional(),
});

export const Itinerary = z.object({
  tripId: z.string(),
  days: z.array(DayPlan),
  summary: z.string(),
  currency: z.string().default("USD"),
});

export type PlaceRef = z.infer<typeof PlaceRef>;
export type ActivityItem = z.infer<typeof ActivityItem>;
export type DayPlan = z.infer<typeof DayPlan>;
export type Itinerary = z.infer<typeof Itinerary>;