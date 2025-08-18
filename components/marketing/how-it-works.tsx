import { Search, Sparkles, Plane } from "lucide-react"

const steps = [
  {
    id: 1,
    title: "Tell us your preferences",
    description: "Share your destination, dates, budget, and interests. Our AI learns what makes your perfect trip.",
    icon: Search,
  },
  {
    id: 2,
    title: "AI creates your itinerary",
    description: "Our advanced AI generates a personalized day-by-day plan with real pricing and availability.",
    icon: Sparkles,
  },
  {
    id: 3,
    title: "Book and enjoy",
    description: "Get direct booking links for flights, hotels, and activities. Your perfect trip is just a click away.",
    icon: Plane,
  },
]

export function HowItWorks() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Simple Process
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How Tripthesia Works
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            From idea to itinerary in three simple steps. Let AI handle the planning while you focus on the excitement.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600">
                  <step.icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="mb-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Step {step.id}
                  </div>
                  {step.title}
                </dt>
                <dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                  {step.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}