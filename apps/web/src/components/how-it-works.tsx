"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Route, MousePointer2 } from "lucide-react";
import { containerVariants, itemVariants, cardHoverVariants } from "@/lib/motion";

const steps = [
  {
    step: "01",
    title: "Tell us your plans",
    description: "Share your destination, dates, budget, and travel style with our AI wizard.",
    icon: Wand2,
    color: "primary",
  },
  {
    step: "02", 
    title: "Get your itinerary",
    description: "Receive a complete day-by-day plan with real prices and booking links in seconds.",
    icon: Route,
    color: "secondary",
  },
  {
    step: "03",
    title: "Customize & book",
    description: "Drag, drop, and lock activities. Book everything directly through our partners.",
    icon: MousePointer2,
    color: "accent",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  return (
    <section 
      ref={containerRef}
      className="relative py-24 overflow-hidden bg-gradient-to-br from-muted/30 via-background to-muted/50"
    >
      {/* Parallax background elements */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
      </motion.div>

      <div className="container relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Simple & Fast
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to your perfect trip. From idea to itinerary in under 60 seconds.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <motion.div
                key={step.step}
                variants={itemVariants}
                custom={index}
              >
                <motion.div
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="h-full"
                >
                  <Card className="relative h-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border transition-colors duration-300">
                    {/* Step connector line (except for last step) */}
                    {index < steps.length - 1 && (
                      <motion.div 
                        className="absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent hidden md:block"
                        initial={{ scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                      />
                    )}

                    <CardHeader className="text-center pb-6">
                      {/* Animated icon */}
                      <motion.div 
                        className={`
                          inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl
                          ${step.color === 'primary' ? 'bg-primary/10 text-primary' :
                            step.color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                            'bg-accent/10 text-accent'
                          }
                        `}
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="w-8 h-8" />
                      </motion.div>

                      {/* Step number */}
                      <motion.div 
                        className={`
                          text-6xl font-bold mb-4 bg-gradient-to-br bg-clip-text text-transparent
                          ${step.color === 'primary' ? 'from-primary-400 to-primary-600' :
                            step.color === 'secondary' ? 'from-secondary-400 to-secondary-600' :
                            'from-accent-400 to-accent-600'
                          }
                        `}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      >
                        {step.step}
                      </motion.div>

                      <CardTitle className="text-xl mb-3">{step.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {step.description}
                      </CardDescription>
                    </CardHeader>

                    {/* Hover glow effect */}
                    <motion.div
                      className={`
                        absolute inset-0 rounded-lg opacity-0 pointer-events-none
                        ${step.color === 'primary' ? 'bg-primary/5 shadow-primary/20' :
                          step.color === 'secondary' ? 'bg-secondary/5 shadow-secondary/20' :
                          'bg-accent/5 shadow-accent/20'
                        }
                      `}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-muted-foreground mb-4">Ready to start planning?</p>
          <motion.div 
            className="inline-flex items-center gap-2 text-primary font-medium cursor-pointer"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            Try it now →
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}