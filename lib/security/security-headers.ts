/**
 * Security Headers Configuration for Tripthesia
 * Production-grade security headers and CSP policies
 */

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXFrameOptions: boolean;
  enableXContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  environment: 'development' | 'staging' | 'production';
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: true,
  enableXContentTypeOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
  environment: (process.env.NODE_ENV as any) || 'development'
};

export class SecurityHeadersManager {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  generateCSP(): string {
    const isDev = this.config.environment === 'development';
    const isStaging = this.config.environment === 'staging';

    const cspDirectives: Record<string, string[]> = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in production
        "'unsafe-eval'", // Required for Next.js development
        'https://checkout.razorpay.com',
        'https://js.stripe.com',
        'https://www.google.com',
        'https://www.gstatic.com',
        ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and Tailwind
        'https://fonts.googleapis.com',
        'https://checkout.razorpay.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:',
        'https://images.unsplash.com',
        'https://avatars.githubusercontent.com',
        'https://lh3.googleusercontent.com' // Google profile images
      ],
      'connect-src': [
        "'self'",
        'https://*.clerk.accounts.dev',
        'https://*.clerk.com',
        'https://api.openai.com',
        'https://api.amadeus.com',
        'https://rapidapi.com',
        'https://*.rapidapi.com',
        'https://api.foursquare.com',
        'https://checkout.razorpay.com',
        'https://*.stripe.com',
        'https://api.mapbox.com',
        'https://*.mapbox.com',
        ...(isDev || isStaging ? ['ws:', 'wss:', 'http://localhost:*', 'https://localhost:*'] : [])
      ],
      'frame-src': [
        "'self'",
        'https://checkout.razorpay.com',
        'https://js.stripe.com',
        'https://www.google.com'
      ],
      'worker-src': [
        "'self'",
        'blob:'
      ],
      'child-src': [
        "'self'",
        'blob:'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': [
        "'self'",
        'https://checkout.razorpay.com'
      ],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    // Remove upgrade-insecure-requests in development
    let finalDirectives = { ...cspDirectives };
    if (isDev) {
      const { 'upgrade-insecure-requests': _, ...rest } = finalDirectives;
      finalDirectives = rest;
    }

    return Object.entries(finalDirectives)
      .map(([directive, sources]) => 
        sources.length > 0 ? `${directive} ${sources.join(' ')}` : directive
      )
      .join('; ');
  }

  generateHSTS(): string {
    // HSTS header - only enable in production with HTTPS
    const maxAge = this.config.environment === 'production' ? 63072000 : 3600; // 2 years in prod, 1 hour otherwise
    return `max-age=${maxAge}; includeSubDomains; preload`;
  }

  generateReferrerPolicy(): string {
    // Strict referrer policy for privacy
    return 'strict-origin-when-cross-origin';
  }

  generatePermissionsPolicy(): string {
    // Permissions policy to disable unnecessary features
    const permissions = [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'interest-cohort=()',
      'payment=(self "https://checkout.razorpay.com" "https://js.stripe.com")',
      'fullscreen=(self)',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'encrypted-media=(self)',
      'picture-in-picture=()'
    ];

    return permissions.join(', ');
  }

  generateSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = this.generateCSP();
    }

    if (this.config.enableHSTS && this.config.environment === 'production') {
      headers['Strict-Transport-Security'] = this.generateHSTS();
    }

    if (this.config.enableXFrameOptions) {
      headers['X-Frame-Options'] = 'DENY';
    }

    if (this.config.enableXContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (this.config.enableReferrerPolicy) {
      headers['Referrer-Policy'] = this.generateReferrerPolicy();
    }

    if (this.config.enablePermissionsPolicy) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicy();
    }

    // Additional security headers
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';

    return headers;
  }

  // Generate Next.js compatible headers configuration
  generateNextJSHeaders(): Array<{ source: string; headers: Array<{ key: string; value: string }> }> {
    const securityHeaders = this.generateSecurityHeaders();

    return [
      {
        source: '/(.*)',
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value
        }))
      }
    ];
  }

  // Generate middleware headers for dynamic routes
  generateMiddlewareHeaders(): Record<string, string> {
    return this.generateSecurityHeaders();
  }

  // Validate current security configuration
  validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for development-specific issues in production
    if (this.config.environment === 'production') {
      const csp = this.generateCSP();
      
      if (csp.includes("'unsafe-eval'")) {
        issues.push("CSP contains 'unsafe-eval' in production - consider removing if possible");
      }

      if (csp.includes('http://')) {
        issues.push('CSP contains HTTP URLs in production - should use HTTPS only');
      }

      if (!this.config.enableHSTS) {
        issues.push('HSTS is disabled in production - should be enabled for security');
      }
    }

    // Check for missing required configurations
    if (!this.config.enableCSP) {
      issues.push('Content Security Policy is disabled - recommended for XSS protection');
    }

    if (!this.config.enableXFrameOptions) {
      issues.push('X-Frame-Options is disabled - recommended for clickjacking protection');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Generate security report
  generateSecurityReport(): {
    config: SecurityConfig;
    headers: Record<string, string>;
    validation: { valid: boolean; issues: string[] };
    recommendations: string[];
  } {
    const headers = this.generateSecurityHeaders();
    const validation = this.validateConfiguration();
    const recommendations = this.generateRecommendations();

    return {
      config: this.config,
      headers,
      validation,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.config.environment === 'production') {
      recommendations.push('Consider implementing Certificate Transparency monitoring');
      recommendations.push('Set up security.txt file for vulnerability disclosure');
      recommendations.push('Implement Subresource Integrity (SRI) for external scripts');
      recommendations.push('Consider implementing CSRF tokens for state-changing operations');
      recommendations.push('Implement rate limiting on API endpoints');
      recommendations.push('Set up Web Application Firewall (WAF) if not already configured');
    }

    if (!this.config.enablePermissionsPolicy) {
      recommendations.push('Enable Permissions Policy to restrict browser feature access');
    }

    recommendations.push('Regularly audit and update security headers');
    recommendations.push('Monitor security headers using tools like securityheaders.com');
    recommendations.push('Implement Content Security Policy reporting for violations');

    return recommendations;
  }
}

// Default instance for easy usage
export const securityHeaders = new SecurityHeadersManager();

// Utility function to get headers for specific environment
export function getSecurityHeaders(environment?: 'development' | 'staging' | 'production'): Record<string, string> {
  const manager = new SecurityHeadersManager({ 
    environment: environment || (process.env.NODE_ENV as any) || 'development' 
  });
  return manager.generateSecurityHeaders();
}

// Utility function for Next.js config
export function getNextJSSecurityHeaders(environment?: 'development' | 'staging' | 'production') {
  const manager = new SecurityHeadersManager({ 
    environment: environment || (process.env.NODE_ENV as any) || 'development' 
  });
  return manager.generateNextJSHeaders();
}