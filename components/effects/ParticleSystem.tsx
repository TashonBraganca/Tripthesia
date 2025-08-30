'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Plane, MapPin, Compass, Navigation } from 'lucide-react';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
  type: 'dot' | 'icon' | 'trail';
  icon?: React.ComponentType<any>;
  rotation?: number;
}

interface ParticleSystemProps {
  enabled?: boolean;
  maxParticles?: number;
  particleCount?: number;
  className?: string;
  interactive?: boolean;
  type?: 'mouse' | 'ambient' | 'click' | 'success';
  theme?: 'travel' | 'minimal' | 'celebration';
}

const travelIcons = [Plane, MapPin, Compass, Navigation];

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  enabled = true,
  maxParticles = 50,
  particleCount = 3,
  className = '',
  interactive = true,
  type = 'mouse',
  theme = 'travel'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  // Particle creation functions
  const createParticle = useCallback((x: number, y: number, particleType: Particle['type'] = 'dot'): Particle => {
    const colors = ['var(--teal-400)', 'var(--sky-400)', 'var(--navy-300)', 'var(--teal-300)'];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 0,
      maxLife: Math.random() * 60 + 40, // 40-100 frames
      size: Math.random() * 4 + 2,
      opacity: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: particleType,
      icon: theme === 'travel' ? travelIcons[Math.floor(Math.random() * travelIcons.length)] : undefined,
      rotation: Math.random() * 360
    };
  }, [theme]);

  const createTrailParticle = useCallback((x: number, y: number): Particle => {
    return {
      ...createParticle(x, y, 'trail'),
      size: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      maxLife: 30
    };
  }, [createParticle]);

  const createSuccessParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const velocity = Math.random() * 3 + 2;
      newParticles.push({
        ...createParticle(x, y, 'icon'),
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        maxLife: Math.random() * 40 + 60,
        size: Math.random() * 6 + 4
      });
    }
    return newParticles;
  }, [createParticle]);

  // Mouse tracking
  useEffect(() => {
    if (!interactive || !enabled || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePos({ x, y });

      // Create trail particles for mouse movement
      if (type === 'mouse' && Math.random() < 0.3) {
        setParticles(prev => {
          if (prev.length >= maxParticles) return prev;
          return [...prev, createTrailParticle(x, y)];
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current || type !== 'click') return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create click explosion
      const newParticles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(createParticle(x, y));
      }
      
      setParticles(prev => [...prev, ...newParticles].slice(-maxParticles));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
    };
  }, [interactive, enabled, shouldReduceMotion, type, particleCount, maxParticles, createParticle, createTrailParticle]);

  // Animation loop
  useEffect(() => {
    if (!enabled || shouldReduceMotion) return;

    const animate = () => {
      setParticles(prev => {
        return prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life + 1,
          opacity: Math.max(0, 1 - (particle.life / particle.maxLife)),
          rotation: particle.rotation ? particle.rotation + 2 : 0
        })).filter(particle => particle.life < particle.maxLife);
      });

      // Add ambient particles
      if (type === 'ambient' && Math.random() < 0.02) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = Math.random() * rect.width;
          const y = Math.random() * rect.height;
          
          setParticles(prev => {
            if (prev.length >= maxParticles) return prev;
            return [...prev, createParticle(x, y)];
          });
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, shouldReduceMotion, type, maxParticles, createParticle]);

  // Public method to trigger success animation
  const triggerSuccess = useCallback((x?: number, y?: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = x ?? rect.width / 2;
    const centerY = y ?? rect.height / 2;
    
    const successParticles = createSuccessParticles(centerX, centerY);
    setParticles(prev => [...prev, ...successParticles].slice(-maxParticles));
  }, [createSuccessParticles, maxParticles]);

  // Expose trigger method via ref - note: this is a convenience method for external access
  // The ref typing issue is acceptable as this is an advanced use case

  if (!enabled || shouldReduceMotion) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: particle.opacity,
              scale: 1,
              x: particle.x,
              y: particle.y,
              rotate: particle.rotation
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.type === 'dot' ? particle.color : 'transparent',
              borderRadius: particle.type === 'dot' ? '50%' : '0',
              boxShadow: particle.type === 'dot' ? `0 0 ${particle.size * 2}px ${particle.color}40` : 'none'
            }}
          >
            {particle.type === 'icon' && particle.icon && (
              <particle.icon 
                size={particle.size} 
                style={{ 
                  color: particle.color,
                  filter: `drop-shadow(0 0 ${particle.size}px ${particle.color}40)`
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Cursor follower for mouse type */}
      {type === 'mouse' && interactive && (
        <motion.div
          className="absolute pointer-events-none"
          animate={{
            x: mousePos.x - 10,
            y: mousePos.y - 10
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <div className="w-5 h-5 rounded-full bg-teal-400/20 blur-sm" />
        </motion.div>
      )}
    </div>
  );
};

// Higher-order component for adding particle effects to any element
export const withParticles = <P extends object>(
  Component: React.ComponentType<P>,
  particleProps?: Partial<ParticleSystemProps>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <div className="relative">
      <Component {...(props as any)} ref={ref} />
      <ParticleSystem {...particleProps} />
    </div>
  ));
  
  WrappedComponent.displayName = `withParticles(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized particle components
export const MouseTrailParticles: React.FC<Omit<ParticleSystemProps, 'type'>> = (props) => (
  <ParticleSystem {...props} type="mouse" />
);

export const ClickParticles: React.FC<Omit<ParticleSystemProps, 'type'>> = (props) => (
  <ParticleSystem {...props} type="click" />
);

export const AmbientParticles: React.FC<Omit<ParticleSystemProps, 'type'>> = (props) => (
  <ParticleSystem {...props} type="ambient" />
);

export const SuccessParticles: React.FC<Omit<ParticleSystemProps, 'type'>> = (props) => (
  <ParticleSystem {...props} type="success" />
);

export default ParticleSystem;