import { z } from "zod";

export const tripWizardSchema = z.object({
  destination: z.object({
    name: z.string().min(1, "Destination is required"),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    placeId: z.string().optional(),
  }),
  dates: z.object({
    from: z.date({
      required_error: "Start date is required",
    }),
    to: z.date({
      required_error: "End date is required",
    }),
  }).refine((data) => data.to > data.from, {
    message: "End date must be after start date",
    path: ["to"],
  }),
  travelers: z.object({
    adults: z.number().min(1, "At least 1 adult required").max(20),
    children: z.number().min(0).max(20),
  }),
  budget: z.object({
    amount: z.number().min(50, "Minimum budget is $50").max(50000),
    currency: z.string().default("USD"),
  }),
  tripType: z.enum(["leisure", "business", "adventure", "cultural", "romantic", "family"], {
    required_error: "Please select a trip type",
  }),
  preferences: z.object({
    accommodationType: z.enum(["budget", "mid-range", "luxury"]).default("mid-range"),
    transportMode: z.enum(["walking", "public", "taxi", "rental"]).default("walking"),
    interests: z.array(z.string()).default([]),
    dietaryRestrictions: z.array(z.string()).default([]),
    mobility: z.enum(["none", "limited", "wheelchair"]).default("none"),
  }),
});

export type TripWizardFormData = z.infer<typeof tripWizardSchema>;

export const destinationSearchSchema = z.object({
  query: z.string().min(2, "Enter at least 2 characters"),
});

export type DestinationSearchData = z.infer<typeof destinationSearchSchema>;