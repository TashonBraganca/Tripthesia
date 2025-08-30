"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { fadeInUp, fadeIn, staggerContainer, buttonHover } from "@/lib/motion-variants"
import { TopographicalGrid } from "@/components/backgrounds/TopographicalGrid"
import { Plane, MapPin, Navigation, Compass } from "lucide-react"

const floatingIcons = [
  { icon: Plane, delay: 0, x: "10%", y: "20%" },
  { icon: MapPin, delay: 0.5, x: "80%", y: "15%" },
  { icon: Navigation, delay: 1, x: "85%", y: "70%" },
  { icon: Compass, delay: 1.5, x: "15%", y: "75%" }
];

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative isolate overflow-hidden min-h-screen flex items-center">
      {/* React Bits Topographical Background */}
      <TopographicalGrid 
        density="normal" 
        animation={!shouldReduceMotion} 
        parallax={!shouldReduceMotion}
        theme="dark"
        className="absolute inset-0"
      />

      {/* Floating travel icons */}
      {!shouldReduceMotion && floatingIcons.map(({ icon: Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute hidden lg:block"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
          animate={{ 
            opacity: 0.4, 
            scale: 1, 
            rotate: 0,
            y: [0, -20, 0]
          }}
          transition={{
            opacity: { duration: 0.6, delay },
            scale: { duration: 0.6, delay },
            rotate: { duration: 0.8, delay },
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: delay + 1
            }
          }}
        >
          <Icon className="w-6 h-6 text-teal-400/60" />
        </motion.div>
      ))}

      {/* Centered Content - Vercel Style */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
        <motion.div 
          className="mx-auto max-w-4xl text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Main Heading */}
          <motion.h1 
            className="display-text bg-gradient-to-r from-navy-50 via-teal-300 to-sky-300 bg-clip-text text-transparent mb-6"
            variants={fadeInUp}
          >
            Plan Your Perfect Journey
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            className="hero-text text-contrast-medium max-w-2xl mx-auto mb-10"
            variants={fadeInUp}
          >
            Create personalized travel itineraries in seconds with real prices and instant booking
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeInUp}
          >
            <motion.div 
              variants={buttonHover} 
              whileHover="hover" 
              whileTap="tap"
            >
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300"
              >
                <Link href="/new">
                  Start Planning
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              variants={buttonHover} 
              whileHover="hover" 
              whileTap="tap"
            >
              <Button 
                variant="outline" 
                asChild 
                size="lg"
                className="border-navy-400 text-navy-100 hover:bg-navy-800/50 hover:text-teal-300 px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300"
              >
                <Link href="/trips">
                  View Examples
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats or features row */}
          <motion.div 
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            {[
              { label: "Countries", value: "190+" },
              { label: "Happy Travelers", value: "50K+" },
              { label: "Trip Success Rate", value: "98%" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center glass p-4 rounded-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
              >
                <div className="text-2xl font-bold text-teal-400 font-serif">
                  {stat.value}
                </div>
                <div className="text-sm text-contrast-medium mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-900 to-transparent pointer-events-none" />
    </div>
  )
}