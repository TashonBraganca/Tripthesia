import { MapPin, Plane, Calendar, CreditCard, Share2, Download } from "lucide-react"
import Link from "next/link"

const navigationSteps = [
  {
    icon: MapPin,
    title: "Choose Destination",
    description: "Pick where you want to go from 200+ countries worldwide",
    step: "01",
    color: "text-blue-500"
  },
  {
    icon: Calendar,
    title: "Set Your Dates",
    description: "Tell us when you want to travel and for how long",
    step: "02", 
    color: "text-green-500"
  },
  {
    icon: Plane,
    title: "AI Creates Your Itinerary",
    description: "Our AI generates a perfect trip plan in under 10 seconds",
    step: "03",
    color: "text-purple-500"
  },
  {
    icon: CreditCard,
    title: "Real Pricing & Booking",
    description: "See actual prices and book flights, hotels, and activities",
    step: "04",
    color: "text-orange-500"
  },
  {
    icon: Share2,
    title: "Share & Collaborate",
    description: "Share your trip with friends or collaborate on planning",
    step: "05",
    color: "text-pink-500"
  },
  {
    icon: Download,
    title: "Export & Travel",
    description: "Download as PDF or add to your calendar",
    step: "06",
    color: "text-cyan-500"
  }
]

export function Testimonials() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Your Travel Adventure Map
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How Tripthesia Works
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Follow the treasure map to discover how our AI creates the perfect travel experience for you
          </p>
        </div>

        <div className="relative">
          {/* Treasure Map Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <defs>
                <pattern id="treasure-map" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 20h40M20 0v40" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#treasure-map)" />
            </svg>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {navigationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative group"
                >
                  {/* Connecting Line for larger screens */}
                  {index < navigationSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 left-full w-8 h-px bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 transform -translate-y-1/2 z-0" />
                  )}
                  
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group-hover:scale-105 z-10">
                    {/* Step Number */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                    
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 mb-6 ${step.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Start Your Adventure?
              </h3>
              <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                Join thousands of travelers who've discovered the future of trip planning. 
                Create your first AI-powered itinerary today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/trips"
                  className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Start Planning Now
                  <Plane className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-all duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}