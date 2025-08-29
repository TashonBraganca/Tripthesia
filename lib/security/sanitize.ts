/**
 * Enhanced input sanitization utilities
 * Goes beyond basic Zod validation to prevent injection attacks
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(;|\||&|`|'|"|\\|\*|%|<|>|\^|\?|\[|\]|\{|\}|\(|\))/g,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
  /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
];

// XSS patterns to detect
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<meta/gi,
  /<style/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

// NoSQL injection patterns
const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$lt/gi,
  /\$gte/gi,
  /\$lte/gi,
  /\$in/gi,
  /\$nin/gi,
  /\$regex/gi,
  /\$exists/gi,
];

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Remove potential XSS vectors
 */
export function sanitizeForXSS(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  let sanitized = input;
  
  // Remove potential XSS patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Escape remaining HTML
  sanitized = escapeHtml(sanitized);
  
  return sanitized.trim();
}

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Detect potential NoSQL injection attempts
 */
export function detectNoSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input for database storage
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Check for injection attempts
  if (detectSQLInjection(input) || detectNoSQLInjection(input)) {
    throw new Error('Potentially malicious input detected');
  }
  
  // Sanitize for XSS
  let sanitized = sanitizeForXSS(input);
  
  // Trim and limit length
  sanitized = sanitized.slice(0, maxLength).trim();
  
  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Basic email validation and sanitization
  const sanitized = email.toLowerCase().trim();
  
  // Check basic email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  const sanitized = url.trim();
  
  // Check for javascript: and data: schemes
  if (/^(javascript|data|vbscript):/i.test(sanitized)) {
    throw new Error('Potentially dangerous URL scheme');
  }
  
  // Ensure it's a valid HTTP/HTTPS URL
  try {
    const parsed = new URL(sanitized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Deep sanitize an object recursively
 */
export function deepSanitize(obj: any, maxDepth: number = 10): any {
  if (maxDepth <= 0) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, maxDepth - 1));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key, 100);
      sanitized[sanitizedKey] = deepSanitize(value, maxDepth - 1);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate and sanitize trip data specifically
 */
export interface SanitizedTripData {
  title: string;
  destinations: Array<{
    city: string;
    country: string;
    lat: number;
    lng: number;
  }>;
  startDate: string;
  endDate: string;
  tripType: string;
  budgetTotal?: number;
  budgetCurrency: string;
}

export function sanitizeTripData(data: any): SanitizedTripData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid trip data');
  }
  
  return {
    title: sanitizeString(data.title, 160),
    destinations: Array.isArray(data.destinations) 
      ? data.destinations.map((dest: any) => ({
          city: sanitizeString(dest.city, 100),
          country: sanitizeString(dest.country, 100),
          lat: typeof dest.lat === 'number' ? dest.lat : 0,
          lng: typeof dest.lng === 'number' ? dest.lng : 0,
        }))
      : [],
    startDate: typeof data.startDate === 'string' ? data.startDate : '',
    endDate: typeof data.endDate === 'string' ? data.endDate : '',
    tripType: sanitizeString(data.tripType, 24),
    budgetTotal: typeof data.budgetTotal === 'number' ? data.budgetTotal : undefined,
    budgetCurrency: sanitizeString(data.budgetCurrency, 3),
  };
}