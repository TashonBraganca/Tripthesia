'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cardVariants, glassCardVariants } from '@/lib/animations/variants';
import { MouseTrailParticles } from './ParticleSystem';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'minimal';
  particles?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className = '',
  variant = 'default',
  particles = true,
  href,
  onClick,
  disabled = false
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  const variants = variant === 'glass' ? glassCardVariants : cardVariants;
  
  const cardContent = (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      variants={shouldReduceMotion ? {} : variants}
      initial="initial"
      whileHover={disabled ? "initial" : "hover"}
      whileTap={disabled ? "initial" : "tap"}
      onClick={disabled ? undefined : onClick}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {particles && !shouldReduceMotion && (
        <MouseTrailParticles 
          maxParticles={20}
          particleCount={2}
          theme="travel"
          className="absolute inset-0"
        />
      )}
      
      {/* Hover glow effect */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(21, 179, 125, 0.1) 0%, transparent 70%)',
          }}
          variants={{
            initial: { opacity: 0, scale: 0.8 },
            hover: { opacity: 1, scale: 1.1 }
          }}
        />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default InteractiveCard;