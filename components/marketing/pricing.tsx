"use client"

import { Button } from "@/components/ui/button"
import { CheckIcon, Sparkles, Zap, Crown } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, cardHover, scaleIn } from "@/lib/motion-variants"

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
    icon: Sparkles,
    gradient: 'from-gray-500 to-gray-600',
    buttonText: 'Get Started Free'
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
    icon: Zap,
    gradient: 'from-indigo-500 to-purple-600',
    buttonText: 'Start Pro Trial'
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
    icon: Crown,
    gradient: 'from-purple-500 to-pink-600',
    buttonText: 'Contact Sales'
  },
]

export function Pricing() {
  return (
    <motion.div 
      className="relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-24 sm:py-32 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-4xl text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400"
            variants={fadeInUp}
          >
            Pricing
          </motion.h2>
          <motion.p 
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
            variants={fadeInUp}
          >
            Choose the{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              right plan
            </span>{" "}
            for you
          </motion.p>
          <motion.p 
            className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300"
            variants={fadeInUp}
          >
            Start free and upgrade as you travel more. Global pricing in USD with multi-currency support worldwide.
          </motion.p>
        </motion.div>

        <motion.div 
          className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                className={`relative rounded-3xl p-8 shadow-xl ${
                  tier.mostPopular
                    ? 'ring-2 ring-indigo-500 bg-white dark:bg-gray-800 scale-105'
                    : 'ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800'
                }`}
                variants={{
                  hidden: { opacity: 0, y: 50, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: tier.mostPopular ? 1.05 : 1,
                    transition: {
                      duration: 0.6,
                      delay: index * 0.2,
                      ease: "easeOut"
                    }
                  }
                }}
                whileHover={{
                  y: -10,
                  scale: tier.mostPopular ? 1.08 : 1.03,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Popular Badge */}
                {tier.mostPopular && (
                  <motion.div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index * 0.2) + 0.3 }}
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      ⭐ Most Popular
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between gap-x-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`p-2 rounded-lg bg-gradient-to-r ${tier.gradient}`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {tier.description}
                </p>

                <motion.div 
                  className="mt-6"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index * 0.2) + 0.4 }}
                >
                  <div className="flex items-baseline gap-x-1">
                    <span className={`text-5xl font-bold tracking-tight bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                      {tier.price.monthly}
                    </span>
                    <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">
                      /month
                    </span>
                  </div>
                  {tier.id !== 'free' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Save 20% with yearly billing
                    </p>
                  )}
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    asChild
                    className={`mt-8 w-full font-semibold text-lg py-3 ${
                      tier.mostPopular
                        ? `bg-gradient-to-r ${tier.gradient} text-white hover:opacity-90 shadow-lg`
                        : `bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600`
                    }`}
                  >
                    <Link href={tier.href} className="flex items-center justify-center gap-2">
                      {tier.buttonText}
                      {tier.mostPopular && (
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Zap className="h-4 w-4" />
                        </motion.div>
                      )}
                    </Link>
                  </Button>
                </motion.div>

                <motion.ul 
                  className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index * 0.2) + 0.6 }}
                >
                  {tier.features.map((feature, featureIndex) => (
                    <motion.li 
                      key={feature} 
                      className="flex gap-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.3, 
                        delay: (index * 0.2) + 0.7 + (featureIndex * 0.1) 
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ 
                          duration: 0.3, 
                          delay: (index * 0.2) + 0.8 + (featureIndex * 0.1),
                          type: "spring"
                        }}
                      >
                        <CheckIcon className={`h-6 w-5 flex-none bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`} />
                      </motion.div>
                      {feature}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-lg text-gray-600 dark:text-gray-300">
            🛡️ 30-day money-back guarantee • 🌍 Available worldwide • 💳 All major currencies supported
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}