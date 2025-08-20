"use client";

import { InteractiveHero } from "./interactive-hero";
import { InteractiveDemoWidget } from "./interactive-demo-widget";
import { DynamicMetrics } from "./dynamic-metrics";
import { EnhancedSocialProof } from "./enhanced-social-proof";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, Zap } from "lucide-react";
import {
  containerVariants,
  itemVariants,
  scrollVariants,
  enhancedCardVariants
} from "@/lib/motion";
import { useScrollAnimation } from "@/lib/scroll-animations";

interface LandingSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

function LandingSection({ children, className = "", id }: LandingSectionProps) {
  const [controls, ref] = useScrollAnimation(0.1);
  
  return (
    <motion.section
      id={id}
      ref={ref}
      animate={controls}
      variants={scrollVariants}
      className={`py-20 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function EnhancedLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <InteractiveHero />

      {/* Demo Widget Section */}
      <LandingSection className="bg-gradient-to-b from-background via-emerald-50/30 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 text-emerald-700 text-sm font-medium">
                <Play className="h-4 w-4" />
                Try Interactive Demo
              </div>
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              See AI Trip Planning in Action
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Experience how Tripthesia creates perfect itineraries in seconds. 
              Choose a destination and watch the magic happen.
            </motion.p>
          </motion.div>

          {/* Interactive Demo Widget */}
          <motion.div
            variants={enhancedCardVariants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
          >
            <InteractiveDemoWidget />
          </motion.div>

          {/* CTA below demo */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" className="gap-2">
              Start Planning Your Trip
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Free to try • No credit card required
            </p>
          </motion.div>
        </div>
      </LandingSection>

      {/* Dynamic Metrics Section */}
      <LandingSection className="bg-gradient-to-b from-background via-sky-50/20 to-background">
        <div className="container mx-auto px-4">
          <DynamicMetrics />
        </div>
      </LandingSection>

      {/* Features Highlight Section */}
      <LandingSection className="bg-gradient-to-b from-background via-amber-50/20 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm font-medium">
                <Zap className="h-4 w-4" />
                Powered by AI
              </div>
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Why Travelers Choose Tripthesia
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Advanced AI technology meets human expertise to create the perfect travel experience
            </motion.p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="h-8 w-8 text-emerald-500" />,
                title: "AI-Powered Planning",
                description: "Our advanced AI analyzes millions of data points to create your perfect itinerary in seconds.",
                stat: "96% accuracy"
              },
              {
                icon: <span className="text-4xl">🌍</span>,
                title: "Global Coverage",
                description: "Plan trips to 200+ countries with real-time pricing and availability from trusted partners.",
                stat: "200+ countries"
              },
              {
                icon: <span className="text-4xl">⚡</span>,
                title: "Instant Optimization",
                description: "Real-time updates and smart rerouting ensure your trip adapts to changing conditions.",
                stat: "< 10 seconds"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={enhancedCardVariants}
                initial="offscreen"
                whileInView="onscreen"
                whileHover="hover"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.2 }}
                className="relative p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  {feature.stat}
                </div>

                {/* Subtle background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </LandingSection>

      {/* Social Proof Section */}
      <LandingSection className="bg-gradient-to-b from-background via-purple-50/20 to-background">
        <div className="container mx-auto px-4">
          <EnhancedSocialProof />
        </div>
      </LandingSection>

      {/* Final CTA Section */}
      <LandingSection className="bg-gradient-to-br from-emerald-500 via-sky-500 to-amber-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Ready to Start?
              </div>
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Your Perfect Trip Awaits
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            >
              Join thousands of travelers who trust Tripthesia to plan their perfect adventures. 
              Start planning your dream trip today.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                className="bg-white text-emerald-600 hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              >
                Start Planning Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg backdrop-blur-sm"
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.p 
              variants={itemVariants}
              className="text-white/70 text-sm mt-6"
            >
              Free to try • Premium features from $8/month • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </LandingSection>
    </div>
  );
}