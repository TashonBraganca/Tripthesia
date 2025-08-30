'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { buttonVariants, easings } from '@/lib/animations/variants';
import { ClickParticles, SuccessParticles } from './ParticleSystem';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  particles?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg'
};

const variantClasses = {
  primary: 'bg-gradient-to-r from-teal-500 to-teal-400 text-navy-900 font-semibold',
  secondary: 'bg-navy-800 text-navy-100 border border-navy-600',
  outline: 'border border-teal-400 text-teal-400 bg-transparent',
  ghost: 'text-teal-400 bg-transparent hover:bg-teal-400/10'
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  success = false,
  particles = true,
  onClick,
  type = 'button'
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [clickPosition, setClickPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Capture click position for particle effects
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setClickPosition({ x, y });

    // Trigger success particles if needed
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    }

    onClick?.();
  };

  React.useEffect(() => {
    if (clickPosition) {
      const timer = setTimeout(() => setClickPosition(null), 300);
      return () => clearTimeout(timer);
    }
  }, [clickPosition]);

  const buttonContent = (
    <>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mr-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </motion.div>
      )}
      
      <motion.span
        variants={{
          initial: { opacity: 1 },
          loading: { opacity: 0.7 }
        }}
        animate={loading ? "loading" : "initial"}
      >
        {children}
      </motion.span>

      {/* Success checkmark */}
      {success && (
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={easings.bounce}
          className="ml-2"
        >
          ✓
        </motion.div>
      )}
    </>
  );

  return (
    <div className="relative inline-block">
      <motion.button
        ref={buttonRef}
        type={type}
        className={`
          relative overflow-hidden rounded-lg font-medium transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-navy-900
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        variants={shouldReduceMotion ? {} : buttonVariants}
        initial="initial"
        whileHover={disabled || loading ? "initial" : "hover"}
        whileTap={disabled || loading ? "initial" : "tap"}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {buttonContent}

        {/* Ripple effect */}
        {clickPosition && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full bg-white/30"
            style={{
              left: clickPosition.x - 10,
              top: clickPosition.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </motion.button>

      {/* Particle effects */}
      {particles && !shouldReduceMotion && (
        <>
          <ClickParticles
            maxParticles={15}
            particleCount={5}
            theme="travel"
            className="absolute inset-0 pointer-events-none"
          />
          
          {showSuccess && (
            <SuccessParticles
              maxParticles={20}
              particleCount={10}
              theme="celebration"
              className="absolute inset-0 pointer-events-none"
            />
          )}
        </>
      )}

      {/* Hover glow */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: variant === 'primary' 
              ? 'radial-gradient(circle at center, rgba(21, 179, 125, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(24, 189, 214, 0.1) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
          variants={{
            initial: { opacity: 0, scale: 0.8 },
            hover: { opacity: 1, scale: 1.2 }
          }}
        />
      )}
    </div>
  );
};

export default AnimatedButton;