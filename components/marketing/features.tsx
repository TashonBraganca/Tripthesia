"use client"

import { 
  MapPinIcon, 
  SparklesIcon, 
  CreditCardIcon, 
  Globe,
  ClockIcon,
  ShieldCheckIcon,
  Zap,
  Users,
  Download
} from "lucide-react"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, cardHover, scaleIn } from "@/lib/motion-variants"

const features = [
  {
    name: 'AI-Powered Planning',
    description:
      'Advanced GPT-4o-mini AI creates personalized itineraries that understand your unique preferences, budget, and travel style.',
    icon: SparklesIcon,
    gradient: 'from-purple-500 to-pink-500',
    delay: '0ms'
  },
  {
    name: 'Real-Time Pricing',
    description:
      'Live prices from trusted partners including flights, hotels, and activities with instant booking links.',
    icon: CreditCardIcon,
    gradient: 'from-green-500 to-emerald-500',
    delay: '100ms'
  },
  {
    name: 'Global Coverage',
    description:
      '200+ countries and territories with local insights, cultural recommendations, and regional expertise.',
    icon: Globe,
    gradient: 'from-blue-500 to-cyan-500',
    delay: '200ms'
  },
  {
    name: 'Interactive Maps',
    description:
      'Beautiful Mapbox-powered maps with drag-and-drop planning, route visualization, and location previews.',
    icon: MapPinIcon,
    gradient: 'from-orange-500 to-yellow-500',
    delay: '300ms'
  },
  {
    name: 'Lightning Fast',
    description:
      'Complete itineraries generated in under 10 seconds. No more hours of research and planning.',
    icon: Zap,
    gradient: 'from-indigo-500 to-purple-500',
    delay: '400ms'
  },
  {
    name: 'Collaboration',
    description:
      'Share and collaborate on trips with friends, family, or colleagues with real-time sync.',
    icon: Users,
    gradient: 'from-pink-500 to-rose-500',
    delay: '500ms'
  },
  {
    name: 'Export & Share',
    description:
      'Download beautiful PDFs or sync with your calendar. Share public links for easy access.',
    icon: Download,
    gradient: 'from-teal-500 to-green-500',
    delay: '600ms'
  },
  {
    name: 'Enterprise Security',
    description:
      'Bank-grade encryption, GDPR compliance, and privacy-first architecture protect your data.',
    icon: ShieldCheckIcon,
    gradient: 'from-red-500 to-pink-500',
    delay: '700ms'
  },
]

export function Features() {
  return (
    <div id="features" className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-24 sm:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.2) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-3xl text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div 
            className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2 mb-8"
            variants={scaleIn}
          >
            <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Powered by Advanced AI
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
            variants={fadeInUp}
          >
            Everything you need to plan the
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> perfect trip</span>
          </motion.h2>
          
          <motion.p 
            className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            From AI-powered itineraries to real-time pricing, we&apos;ve revolutionized travel planning with cutting-edge technology and global partnerships.
          </motion.p>
        </motion.div>

        <motion.div 
          className="mx-auto mt-20 max-w-7xl"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.name}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                  whileInView={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: "easeOut" 
                    }
                  }}
                  viewport={{ once: true }}
                  style={{ 
                    opacity: 0, 
                    y: 50 
                  }}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                  
                  {/* Icon */}
                  <div className={`relative inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors duration-300" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <SparklesIcon className="mr-2 h-5 w-5" />
              Start Planning Now
            </motion.button>
            <motion.button 
              className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-semibold rounded-xl transition-all duration-300 shadow-lg"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgb(249 250 251)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              View Live Demo
            </motion.button>
          </div>
        </motion.div>
      </div>

    </div>
  )
}