"use client"

import { Search, Sparkles, Plane, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion-variants"

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
    <motion.div 
      className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-24 sm:py-32 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
          <defs>
            <pattern id="steps-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#steps-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-3xl text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400"
            variants={fadeInUp}
          >
            Simple Process
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl"
            variants={fadeInUp}
          >
            How{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Tripthesia Works
            </span>
          </motion.p>
          <motion.p 
            className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            From idea to itinerary in three simple steps. Let AI handle the planning while you focus on the excitement.
          </motion.p>
        </motion.div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <motion.dl 
            className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="relative flex flex-col items-center text-center group"
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.6,
                      delay: index * 0.3,
                      ease: "easeOut"
                    }
                  }
                }}
              >
                {/* Connecting Arrow */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-8 left-full w-8 h-8 text-indigo-300 dark:text-indigo-600"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index * 0.3) + 0.5 }}
                  >
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="w-8 h-8" />
                    </motion.div>
                  </motion.div>
                )}

                {/* Icon Circle */}
                <motion.div 
                  className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: (index * 0.3) + 0.2,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.4 }
                  }}
                >
                  {/* Step Number Badge */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-md"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.3, 
                      delay: (index * 0.3) + 0.4,
                      type: "spring"
                    }}
                  >
                    {step.id}
                  </motion.div>

                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{ 
                      duration: 20, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                  >
                    <step.icon className="h-10 w-10 text-white" aria-hidden="true" />
                  </motion.div>

                  {/* Pulse Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 0, 0.7]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                  />
                </motion.div>

                {/* Content */}
                <motion.dt 
                  className="text-xl font-semibold leading-7 text-gray-900 dark:text-white"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index * 0.3) + 0.6 }}
                >
                  <motion.div 
                    className="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (index * 0.3) + 0.5 }}
                  >
                    Step {step.id}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (index * 0.3) + 0.6 }}
                  >
                    {step.title}
                  </motion.div>
                </motion.dt>

                <motion.dd 
                  className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300 max-w-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index * 0.3) + 0.8 }}
                >
                  {step.description}
                </motion.dd>

                {/* Decorative Elements */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-indigo-200 to-transparent dark:from-indigo-800"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (index * 0.3) + 1 }}
                />
              </motion.div>
            ))}
          </motion.dl>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Ready to start planning?</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}