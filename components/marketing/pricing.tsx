import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import Link from "next/link"

const tiers = [
  {
    name: 'Free',
    id: 'free',
    href: '/sign-up',
    price: { monthly: '$0', yearly: '$0' },
    description: 'Perfect for trying out Tripthesia globally.',
    features: [
      '2 trips per month',
      'Basic AI planning',
      'PDF & ICS export',
      'Standard support',
      'Global destinations',
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'pro',
    href: '/upgrade',
    price: { monthly: '$12', yearly: '$120' },
    description: 'Great for frequent travelers worldwide.',
    features: [
      '10 trips per month',
      'Advanced AI planning',
      'Real-time pricing',
      'Interactive maps',
      'Collaboration features',
      'Priority support',
      'Multi-currency support',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    href: '/upgrade',
    price: { monthly: '$25', yearly: '$250' },
    description: 'For agencies, teams, and power users.',
    features: [
      'Unlimited trips',
      'Premium AI models',
      'Team management',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'White-label options',
      'Analytics dashboard',
    ],
    mostPopular: false,
  },
]

export function Pricing() {
  return (
    <div className="bg-white dark:bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Pricing
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
          Start free and upgrade as you travel more. Global pricing in USD with multi-currency support worldwide.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`${
                tier.mostPopular
                  ? 'ring-2 ring-indigo-600 dark:ring-indigo-400'
                  : 'ring-1 ring-gray-200 dark:ring-gray-700'
              } rounded-3xl p-8 ${
                tier.mostPopular ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  className={`${
                    tier.mostPopular ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                  } text-lg font-semibold leading-8`}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-600 dark:text-indigo-400">
                    Most popular
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {tier.price.monthly}
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">
                  /month
                </span>
              </p>
              <Button
                asChild
                className={`${
                  tier.mostPopular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                    : 'bg-white text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 dark:bg-gray-800 dark:text-indigo-400'
                } mt-6 w-full`}
              >
                <Link href={tier.href}>
                  Get started
                </Link>
              </Button>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}