/**
 * Database Schema Re-export
 * Maps to the main schema file in infra/
 */

// Re-export everything from the main schema file
export {
  users,
  profiles,
  trips,
  itineraries,
  sharedTrips,
  places,
  priceQuotes
} from '../../../../../infra/schema'

// Re-export all types as well
export type {
  User,
  Profile,
  Trip,
  Itinerary,
  SharedTrip,
  Place,
  PriceQuote,
  NewUser,
  NewProfile,
  NewTrip,
  NewItinerary,
  NewSharedTrip,
  NewPlace,
  NewPriceQuote
} from '../../../../../infra/schema'