// Skip Link Component - Phase 8 Accessibility Excellence
// Allows keyboard users to skip navigation and jump to main content

'use client';

import { useSkipLink } from '@/lib/accessibility/hooks';

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ targetId, children, className = '' }: SkipLinkProps) {
  const { skipToContent } = useSkipLink(targetId);

  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        skipToContent();
      }}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-navy-900 text-white px-4 py-2 rounded-md z-50 
        font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
        ${className}
      `}
    >
      {children}
    </a>
  );
}

// Screen reader only text component
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Live region for announcements
export function LiveRegion({ 
  children, 
  level = 'polite' 
}: { 
  children: React.ReactNode; 
  level?: 'polite' | 'assertive' 
}) {
  return (
    <div 
      aria-live={level}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}