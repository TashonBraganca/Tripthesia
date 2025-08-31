"use client"

import { motion } from "framer-motion"
import { 
  Sparkles, 
  CreditCard, 
  Globe, 
  MapPin, 
  Zap, 
  Users, 
  Download,
  ShieldCheck,
  Calendar,
  Star
} from "lucide-react"
import { fadeInUp, staggerContainer } from "@/lib/motion-variants"

const bentoFeatures = [
  {
    title: "Smart Planning",
    description: "Advanced algorithms create personalized itineraries in seconds",
    icon: Sparkles,
    size: "large", // 2x2 grid
    gradient: "from-purple-500/20 to-pink-500/20",
    iconGradient: "from-purple-500 to-pink-500",
    stats: "10s avg generation time",
    image: "/images/planning-preview.jpg"
  },
  {
    title: "Real-Time Pricing",
    description: "Live prices and instant booking",
    icon: CreditCard,
    size: "medium", // 1x2 grid
    gradient: "from-green-500/20 to-emerald-500/20",
    iconGradient: "from-green-500 to-emerald-500",
    stats: "Updated every 30s"
  },
  {
    title: "Global Coverage",
    description: "200+ countries",
    icon: Globe,
    size: "small", // 1x1 grid
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconGradient: "from-blue-500 to-cyan-500",
    stats: "200+"
  },
  {
    title: "Interactive Maps",
    description: "Drag-and-drop planning with beautiful visualizations",
    icon: MapPin,
    size: "medium", // 1x2 grid
    gradient: "from-orange-500/20 to-yellow-500/20",
    iconGradient: "from-orange-500 to-yellow-500",
    stats: "Mapbox powered"
  },
  {
    title: "Lightning Fast",
    description: "Instant results",
    icon: Zap,
    size: "small", // 1x1 grid
    gradient: "from-indigo-500/20 to-purple-500/20",
    iconGradient: "from-indigo-500 to-purple-500",
    stats: "<10s"
  },
  {
    title: "Team Collaboration",
    description: "Real-time sync",
    icon: Users,
    size: "small", // 1x1 grid
    gradient: "from-pink-500/20 to-rose-500/20",
    iconGradient: "from-pink-500 to-rose-500",
    stats: "Real-time"
  },
  {
    title: "Export & Share",
    description: "PDF, calendar sync, and public links",
    icon: Download,
    size: "large", // 2x1 grid
    gradient: "from-teal-500/20 to-green-500/20",
    iconGradient: "from-teal-500 to-green-500",
    stats: "Multiple formats"
  }
]

export function BentoFeatures() {
  return (
    <div id="bento-features" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800" />
      
      {/* Topographical pattern overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(21, 179, 125, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, transparent 25%, rgba(21, 179, 125, 0.05) 25%, rgba(21, 179, 125, 0.05) 50%, transparent 50%, transparent 75%, rgba(6, 182, 212, 0.05) 75%)
          `,
          backgroundSize: '100px 100px, 100px 100px, 50px 50px'
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          className="mx-auto max-w-3xl text-center mb-20"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div 
            className="inline-flex items-center rounded-full bg-teal-500/10 border border-teal-500/20 px-6 py-2 mb-8"
            variants={fadeInUp}
          >
            <Sparkles className="h-5 w-5 text-teal-400 mr-2" />
            <span className="text-sm font-semibold text-teal-400">
              Everything You Need
            </span>
          </motion.div>
          
          <motion.h2 
            className="display-text bg-gradient-to-r from-navy-50 via-teal-300 to-sky-300 bg-clip-text text-transparent mb-6"
            variants={fadeInUp}
          >
            Powerful Features, Beautiful Experience
          </motion.h2>
          
          <motion.p 
            className="body-text text-contrast-medium max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            From intelligent planning to real-time pricing, every feature is designed to make travel planning effortless and enjoyable.
          </motion.p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {bentoFeatures.map((feature, index) => {
            const Icon = feature.icon;
            
            // Grid sizing classes
            const sizeClasses = {
              small: "lg:col-span-1 lg:row-span-1",
              medium: "lg:col-span-1 lg:row-span-2", 
              large: "lg:col-span-2 lg:row-span-2",
              wide: "lg:col-span-2 lg:row-span-1"
            };

            return (
              <motion.div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${feature.gradient} glass border border-navy-400/30 p-6 transition-all duration-500 hover:border-teal-400/50 ${sizeClasses[feature.size as keyof typeof sizeClasses]}`}
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.02,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { 
                    duration: 0.6, 
                    delay: index * 0.1 
                  }
                }}
                viewport={{ once: true }}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                
                {/* Content container */}
                <div className="relative h-full flex flex-col">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconGradient} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Main content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-navy-50 mb-2 group-hover:text-teal-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-contrast-medium text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                  </div>

                  {/* Stats badge */}
                  <div className="mt-auto">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-navy-800/50 border border-navy-400/30 text-xs font-medium text-teal-400">
                      {feature.stats}
                    </div>
                  </div>

                  {/* Decorative elements for large cards */}
                  {feature.size === 'large' && (
                    <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400/20 to-transparent" />
                    </div>
                  )}
                </div>

                {/* Hover shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-teal-500/20"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 25px -5px rgba(21, 179, 125, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Experience All Features
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}