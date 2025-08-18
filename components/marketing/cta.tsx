import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <div className="bg-indigo-600 dark:bg-indigo-900">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to plan your next adventure?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
            Join thousands of travelers who trust Tripthesia to create their perfect itineraries. 
            Start planning your dream trip today - it's free to get started!
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-50 font-semibold"
            >
              <Link href="/new" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Start Planning Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-indigo-600"
            >
              <Link href="/trips">
                View Examples
              </Link>
            </Button>
          </div>
          <div className="mt-8 text-sm text-indigo-200">
            No credit card required • 2 free trips included • Upgrade anytime
          </div>
        </div>
      </div>
    </div>
  )
}