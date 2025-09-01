/**
 * Comprehensive Security Audit System for Production
 * Monitors security vulnerabilities and implements hardening
 */

import { NextRequest } from 'next/server';

export interface SecurityThreat {
  id: string;
  type: 'xss' | 'sql_injection' | 'rate_limit' | 'suspicious_activity' | 'auth_bypass' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userAgent?: string;
  userId?: string;
  timestamp: string;
  details: Record<string, any>;
  blocked: boolean;
}

export interface SecurityMetrics {
  threats: SecurityThreat[];
  rateLimit: {
    requests: Record<string, number>;
    blocked: Record<string, number>;
  };
  authentication: {
    failed_logins: number;
    suspicious_patterns: number;
  };
  data_protection: {
    pii_detected: number;
    encryption_status: 'active' | 'degraded' | 'disabled';
  };
}

class SecurityAuditor {
  private threats: SecurityThreat[] = [];
  private rateLimitTracker: Map<string, { count: number; lastReset: number }> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private readonly MAX_API_REQUESTS_PER_MINUTE = 20;
  private readonly MAX_THREATS_HISTORY = 10000;

  // XSS Protection
  detectXSS(input: string, context: string): SecurityThreat | null {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return this.createThreat('xss', 'high', context, {
          input: input.substring(0, 200),
          pattern: pattern.source,
          context,
        }, true);
      }
    }

    return null;
  }

  // SQL Injection Detection
  detectSQLInjection(input: string, context: string): SecurityThreat | null {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b).*(\bFROM\b|\bINTO\b|\bWHERE\b)/gi,
      /('|\").*(\bOR\b|\bAND\b).*('|\")/gi,
      /;.*(\bDROP\b|\bDELETE\b|\bTRUNCATE\b)/gi,
      /\/\*.*\*\//g,
      /--.*$/gm,
      /\bxp_cmdshell\b/gi,
      /\bsp_executesql\b/gi,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return this.createThreat('sql_injection', 'critical', context, {
          input: input.substring(0, 200),
          pattern: pattern.source,
          context,
        }, true);
      }
    }

    return null;
  }

  // Rate Limiting
  checkRateLimit(clientId: string, endpoint: string, isAPI: boolean = false): SecurityThreat | null {
    const key = `${clientId}:${endpoint}`;
    const now = Date.now();
    const limit = isAPI ? this.MAX_API_REQUESTS_PER_MINUTE : this.MAX_REQUESTS_PER_MINUTE;
    
    const tracker = this.rateLimitTracker.get(key) || { count: 0, lastReset: now };
    
    // Reset counter if a minute has passed
    if (now - tracker.lastReset > 60000) {
      tracker.count = 0;
      tracker.lastReset = now;
    }
    
    tracker.count++;
    this.rateLimitTracker.set(key, tracker);
    
    if (tracker.count > limit) {
      return this.createThreat('rate_limit', 'medium', endpoint, {
        clientId: clientId.substring(0, 10) + '***', // Partial masking
        endpoint,
        requestCount: tracker.count,
        limit,
        timeWindow: '1 minute',
      }, true);
    }
    
    return null;
  }

  // Suspicious Activity Detection
  detectSuspiciousActivity(request: NextRequest): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const path = request.nextUrl.pathname;

    // Bot detection
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python-requests/i, /go-http-client/i
    ];
    
    const isSuspiciousBot = botPatterns.some(pattern => pattern.test(userAgent));
    if (isSuspiciousBot && !path.startsWith('/api/health')) {
      threats.push(this.createThreat('suspicious_activity', 'low', path, {
        type: 'bot_activity',
        userAgent: userAgent.substring(0, 100),
        path,
      }, false));
    }

    // Suspicious paths
    const suspiciousPathPatterns = [
      /wp-admin/i, /wp-login/i, /admin/i, /phpmyadmin/i,
      /\.php$/i, /\.asp$/i, /\.jsp$/i,
      /shell/i, /backdoor/i, /config/i,
    ];

    const isSuspiciousPath = suspiciousPathPatterns.some(pattern => pattern.test(path));
    if (isSuspiciousPath) {
      threats.push(this.createThreat('suspicious_activity', 'medium', path, {
        type: 'suspicious_path',
        path,
        userAgent: userAgent.substring(0, 100),
      }, true));
    }

    // Directory traversal attempts
    if (path.includes('../') || path.includes('..\\') || path.includes('%2e%2e')) {
      threats.push(this.createThreat('suspicious_activity', 'high', path, {
        type: 'directory_traversal',
        path,
        userAgent: userAgent.substring(0, 100),
      }, true));
    }

    return threats;
  }

  // PII Detection
  detectPII(data: string, context: string): SecurityThreat | null {
    const piiPatterns = [
      { name: 'ssn', pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g },
      { name: 'credit_card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
      { name: 'phone', pattern: /\b\d{3}-?\d{3}-?\d{4}\b/g },
      { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    ];

    for (const { name, pattern } of piiPatterns) {
      const matches = data.match(pattern);
      if (matches && matches.length > 0) {
        return this.createThreat('data_breach', 'critical', context, {
          type: 'pii_exposure',
          piiType: name,
          occurrences: matches.length,
          context,
          sample: matches[0].substring(0, 10) + '***', // Partial masking
        }, true);
      }
    }

    return null;
  }

  // Input Validation
  validateInput(input: any, rules: ValidationRule[]): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    for (const rule of rules) {
      try {
        switch (rule.type) {
          case 'maxLength':
            if (typeof input === 'string' && rule.value && input.length > rule.value) {
              threats.push(this.createThreat('suspicious_activity', 'medium', 'input_validation', {
                type: 'input_too_long',
                rule: rule.type,
                actual: input.length,
                max: rule.value,
              }, false));
            }
            break;
          case 'allowedChars':
            if (typeof input === 'string' && rule.pattern && !rule.pattern.test(input)) {
              threats.push(this.createThreat('suspicious_activity', 'medium', 'input_validation', {
                type: 'invalid_characters',
                rule: rule.type,
                pattern: rule.pattern.source,
              }, false));
            }
            break;
          case 'noHtml':
            if (typeof input === 'string' && /<[^>]+>/g.test(input)) {
              threats.push(this.createThreat('xss', 'high', 'input_validation', {
                type: 'html_detected',
                input: input.substring(0, 100),
              }, true));
            }
            break;
        }
      } catch (error) {
        // Log validation error but don't throw
        console.error('Input validation error:', error);
      }
    }

    return threats;
  }

  // Authentication Security
  trackAuthenticationEvent(event: 'login_success' | 'login_failure' | 'suspicious_login', details: Record<string, any>): void {
    if (event === 'login_failure' || event === 'suspicious_login') {
      const threat = this.createThreat('auth_bypass', 'medium', 'authentication', {
        event,
        ...details,
        timestamp: new Date().toISOString(),
      }, event === 'suspicious_login');
      
      this.threats.push(threat);
    }
  }

  private createThreat(
    type: SecurityThreat['type'],
    severity: SecurityThreat['severity'],
    source: string,
    details: Record<string, any>,
    blocked: boolean
  ): SecurityThreat {
    const threat: SecurityThreat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      source,
      timestamp: new Date().toISOString(),
      details,
      blocked,
    };

    this.threats.push(threat);

    // Keep only recent threats
    if (this.threats.length > this.MAX_THREATS_HISTORY) {
      this.threats = this.threats.slice(-this.MAX_THREATS_HISTORY);
    }

    // Log high/critical threats immediately
    if (severity === 'high' || severity === 'critical') {
      console.warn(`Security threat detected [${severity.toUpperCase()}]:`, {
        id: threat.id,
        type,
        source,
        blocked,
      });
      
      // Send to monitoring service
      this.alertMonitoring(threat);
    }

    return threat;
  }

  private async alertMonitoring(threat: SecurityThreat): Promise<void> {
    try {
      await fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: 'security_threat',
          threat,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // Get security metrics
  getSecurityMetrics(timeWindow: number = 3600000): SecurityMetrics {
    const cutoff = Date.now() - timeWindow;
    const recentThreats = this.threats.filter(t => 
      new Date(t.timestamp).getTime() > cutoff
    );

    return {
      threats: recentThreats,
      rateLimit: {
        requests: this.getRateLimitStats(),
        blocked: this.getBlockedRequestStats(),
      },
      authentication: {
        failed_logins: recentThreats.filter(t => 
          t.type === 'auth_bypass' && t.details.event === 'login_failure'
        ).length,
        suspicious_patterns: recentThreats.filter(t => 
          t.type === 'suspicious_activity'
        ).length,
      },
      data_protection: {
        pii_detected: recentThreats.filter(t => t.type === 'data_breach').length,
        encryption_status: 'active',
      },
    };
  }

  private getRateLimitStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    Array.from(this.rateLimitTracker.entries()).forEach(([key, tracker]) => {
      stats[key] = tracker.count;
    });
    return stats;
  }

  private getBlockedRequestStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    const blockedThreats = this.threats.filter(t => t.blocked);
    
    for (const threat of blockedThreats) {
      const key = `${threat.type}:${threat.source}`;
      stats[key] = (stats[key] || 0) + 1;
    }
    
    return stats;
  }

  // Cleanup old data
  cleanup(maxAge: number = 24 * 3600000): void {
    const cutoff = Date.now() - maxAge;
    this.threats = this.threats.filter(t => 
      new Date(t.timestamp).getTime() > cutoff
    );
  }
}

export interface ValidationRule {
  type: 'maxLength' | 'allowedChars' | 'noHtml';
  value?: number;
  pattern?: RegExp;
}

// Security middleware wrapper
export function withSecurityAudit(handler: Function) {
  return async function(this: any, request: NextRequest, ...args: any[]) {
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check for suspicious activity
    const threats = securityAuditor.detectSuspiciousActivity(request);
    const blockedThreats = threats.filter(t => t.blocked);
    
    if (blockedThreats.length > 0) {
      return new Response(JSON.stringify({
        error: 'Security threat detected',
        blocked: true,
        reason: 'suspicious_activity',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Rate limiting check
    const rateLimitThreat = securityAuditor.checkRateLimit(
      clientIP, 
      request.nextUrl.pathname,
      request.nextUrl.pathname.startsWith('/api/')
    );
    
    if (rateLimitThreat && rateLimitThreat.blocked) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        blocked: true,
        reason: 'rate_limit',
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return handler.call(this, request, ...args);
  };
}

// Singleton instance
export const securityAuditor = new SecurityAuditor();

// Cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    securityAuditor.cleanup();
  }, 3600000); // Clean up every hour
}