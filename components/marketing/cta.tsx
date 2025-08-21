"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Globe, Users } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants"

export function CTA() {
  return (
    <motion.div 
      className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-800 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), 
                           radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <motion.div 
          className="mx-auto max-w-4xl text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            variants={fadeInUp}
          >
            Ready to plan your next{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              adventure?
            </span>
          </motion.h2>
          
          <motion.p 
            className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100 sm:text-xl"
            variants={fadeInUp}
          >
            Join thousands of travelers who trust Tripthesia to create their perfect itineraries. 
            Start planning your dream trip today - it&apos;s free to get started!
          </motion.p>

          {/* Stats Section */}
          <motion.div 
            className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-16"
            variants={fadeInUp}
          >
            <div className="text-center">
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Users className="h-6 w-6 text-white" />
              </motion.div>
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-sm text-indigo-200">Happy Travelers</div>
            </div>
            <div className="text-center">
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Globe className="h-6 w-6 text-white" />
              </motion.div>
              <div className="text-2xl font-bold text-white">200+</div>
              <div className="text-sm text-indigo-200">Countries</div>
            </div>
            <div className="text-center col-span-2 sm:col-span-1">
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-indigo-200">Trips Created</div>
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeInUp}
          >
            <motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
              <Button
                asChild
                size="lg"
                className="bg-white text-indigo-600 hover:bg-gray-50 font-semibold text-lg px-8 py-3 shadow-lg"
              >
                <Link href="/new" className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                  Start Planning Free
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Link>
              </Button>
            </motion.div>
            
            <motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-semibold text-lg px-8 py-3"
              >
                <Link href="/trips">
                  View Examples
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-indigo-100"
            variants={fadeInUp}
          >
            <span className="flex items-center gap-1">
              ✓ No credit card required
            </span>
            <span className="flex items-center gap-1">
              ✓ 2 free trips included
            </span>
            <span className="flex items-center gap-1">
              ✓ Upgrade anytime
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}