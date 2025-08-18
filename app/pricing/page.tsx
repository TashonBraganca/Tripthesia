import { Button } from "@/components/ui/button"
import { CheckIcon, Sparkles, Users, Crown } from "lucide-react"
import Link from "next/link"

const tiers = [
  {
    name: 'Free',
    id: 'free',
    href: '/sign-up',
    price: '$0',
    description: 'Perfect for trying out Tripthesia globally.',
    features: [
      '2 trips per month',
      'Basic AI planning',
      'PDF & ICS export', 
      'Standard support',
      'Global destinations',
    ],
    cta: 'Get Started',
    mostPopular: false,
    icon: Sparkles,
    gradient: 'from-gray-500 to-gray-600'
  },
  {
    name: 'Pro',
    id: 'pro',
    href: '/upgrade',
    price: '$12',
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
    cta: 'Start Pro Trial',
    mostPopular: true,
    icon: Users,
    gradient: 'from-indigo-500 to-purple-600'
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    href: '/upgrade',
    price: '$25',
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
    cta: 'Contact Sales',
    mostPopular: false,
    icon: Crown,
    gradient: 'from-emerald-500 to-teal-600'
  },
]

export default function PricingPage() {
  return (
    <div className="bg-white dark:bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Pricing
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose the perfect plan for your travels
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
          Start free and upgrade as you travel more. Global pricing in USD with multi-currency support worldwide.
        </p>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <div
                key={tier.id}
                className={`group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 ${
                  tier.mostPopular
                    ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 scale-105'
                    : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-300 dark:hover:ring-indigo-600'
                }`}
              >
                {/* Popular Badge */}
                {tier.mostPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                      Most Popular
                    </div>
                  </div>
                )}
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${tier.gradient} shadow-lg mb-6`}>
                  <IconComponent className="h-7 w-7 text-white" />
                </div>
                
                {/* Header */}
                <div className="flex items-center justify-between gap-x-4 mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {tier.description}
                </p>
                
                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-x-1">
                    <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {tier.price}
                    </span>
                    <span className="text-lg font-semibold leading-6 text-gray-600 dark:text-gray-300">
                      /month
                    </span>
                  </div>
                  {tier.id === 'pro' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Billed annually or $15/month
                    </p>
                  )}
                  {tier.id === 'enterprise' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Billed annually or $30/month
                    </p>
                  )}
                </div>
                
                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full mb-8 ${
                    tier.mostPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  size="lg"
                >
                  <Link href={tier.href}>
                    {tier.cta}
                  </Link>
                </Button>
                
                {/* Features */}
                <ul className="space-y-3 text-sm leading-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className="h-6 w-5 flex-none text-indigo-600 dark:text-indigo-400"
                        aria-hidden="true"
                      />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
              Frequently Asked Questions
            </h3>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Can I change plans anytime?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What currencies do you support?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We support USD, EUR, GBP, CAD, AUD, INR, SGD, and JPY with automatic conversion.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Is there a free trial?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! Start with our free plan and upgrade when you need more features. No credit card required.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Do you offer refunds?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Need a custom solution for your organization?
          </p>
          <Link
            href="mailto:tashon.braganca.ai@gmail.com"
            className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}