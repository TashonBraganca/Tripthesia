// Color Contrast Audit Utility - Phase 8 Accessibility Excellence
// WCAG 2.1 AA compliance checker for color combinations

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): ColorRGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance according to WCAG 2.1
 */
function getLuminance(rgb: ColorRGB): number {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG standards
 */
export function checkWCAGCompliance(foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  wcagAALarge: boolean;
  wcagAAALarge: boolean;
} {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    ratio,
    wcagAA: ratio >= 4.5,        // Normal text
    wcagAAA: ratio >= 7,         // Enhanced contrast
    wcagAALarge: ratio >= 3,     // Large text (18pt+ or 14pt+ bold)
    wcagAAALarge: ratio >= 4.5   // Large text enhanced
  };
}

/**
 * Tripthesia Color Palette for audit
 */
export const TripthesiaColors = {
  // Navy Scale
  navy: {
    950: '#030B14',
    900: '#061A2C', 
    800: '#0A2540',
    700: '#0F2B54',
    600: '#1B3B6F',
    500: '#2D4F85',
    400: '#4268A3',
    300: '#5D7FB8',
    200: '#8DA6CE',
    100: '#B8C7D3',
    50: '#E6F0F8'
  },
  
  // Teal Scale
  teal: {
    900: '#0A3B2E',
    800: '#0F4C3A',
    700: '#135D46',
    600: '#177052',
    500: '#15B37D',
    400: '#22C692',
    300: '#4DD4A4',
    200: '#7DE2B8',
    100: '#B8F0D1',
    50: '#E8FCEF'
  },

  // Sky Scale  
  sky: {
    900: '#0B2A3D',
    800: '#10384F',
    700: '#154761',
    600: '#1A5573',
    500: '#2196C7',
    400: '#18BDD6',
    300: '#38CAE3',
    200: '#68D9ED',
    100: '#98E8F7',
    50: '#E0F7FF'
  },

  // Semantic Colors
  error: '#FF6B6B',
  warning: '#F59E0B',
  success: '#15B37D',
  info: '#18BDD6'
};

/**
 * Common color combinations used in Tripthesia
 */
export const ColorCombinations = [
  // Dark theme primary combinations
  { name: 'Primary text on dark background', fg: TripthesiaColors.navy[50], bg: TripthesiaColors.navy[900] },
  { name: 'Secondary text on dark background', fg: TripthesiaColors.navy[200], bg: TripthesiaColors.navy[900] },
  { name: 'Tertiary text on dark background', fg: TripthesiaColors.navy[300], bg: TripthesiaColors.navy[900] },
  
  // Teal accent combinations
  { name: 'Teal text on dark background', fg: TripthesiaColors.teal[400], bg: TripthesiaColors.navy[900] },
  { name: 'White text on teal button', fg: '#FFFFFF', bg: TripthesiaColors.teal[500] },
  { name: 'Navy text on teal button', fg: TripthesiaColors.navy[900], bg: TripthesiaColors.teal[500] },
  
  // Card and surface combinations
  { name: 'Primary text on card', fg: TripthesiaColors.navy[50], bg: TripthesiaColors.navy[800] },
  { name: 'Secondary text on card', fg: TripthesiaColors.navy[200], bg: TripthesiaColors.navy[800] },
  
  // Interactive state combinations
  { name: 'Hover text on navy', fg: TripthesiaColors.teal[300], bg: TripthesiaColors.navy[700] },
  { name: 'Focus ring visibility', fg: TripthesiaColors.teal[400], bg: TripthesiaColors.navy[900] },
  
  // Error and warning states
  { name: 'Error text on dark', fg: TripthesiaColors.error, bg: TripthesiaColors.navy[900] },
  { name: 'Warning text on dark', fg: TripthesiaColors.warning, bg: TripthesiaColors.navy[900] },
  { name: 'Success text on dark', fg: TripthesiaColors.success, bg: TripthesiaColors.navy[900] },
  
  // Border visibility
  { name: 'Border on dark background', fg: TripthesiaColors.navy[600], bg: TripthesiaColors.navy[900] },
  { name: 'Accent border on dark', fg: TripthesiaColors.teal[500], bg: TripthesiaColors.navy[900] },
];

/**
 * Run complete color contrast audit
 */
export function auditColorContrast(): {
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    name: string;
    foreground: string;
    background: string;
    ratio: number;
    wcagAA: boolean;
    wcagAALarge: boolean;
    status: 'pass' | 'fail' | 'warning';
    recommendations?: string;
  }>;
} {
  const results = ColorCombinations.map(combination => {
    const compliance = checkWCAGCompliance(combination.fg, combination.bg);
    
    let status: 'pass' | 'fail' | 'warning' = 'pass';
    let recommendations = '';
    
    if (!compliance.wcagAA && !compliance.wcagAALarge) {
      status = 'fail';
      recommendations = `Contrast ratio ${compliance.ratio.toFixed(2)} is too low. Increase to 4.5+ for normal text or 3+ for large text.`;
    } else if (!compliance.wcagAA && compliance.wcagAALarge) {
      status = 'warning';
      recommendations = `Only passes for large text (18pt+ or 14pt+ bold). Use larger font sizes or improve contrast for normal text.`;
    }
    
    return {
      name: combination.name,
      foreground: combination.fg,
      background: combination.bg,
      ratio: compliance.ratio,
      wcagAA: compliance.wcagAA,
      wcagAALarge: compliance.wcagAALarge,
      status,
      recommendations
    };
  });
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

/**
 * Suggest accessible color alternatives
 */
export function suggestColorFix(foreground: string, background: string, targetRatio: number = 4.5): {
  originalRatio: number;
  needsImprovement: boolean;
  suggestions: Array<{
    type: 'lighten' | 'darken';
    color: string;
    newRatio: number;
  }>;
} {
  const originalRatio = getContrastRatio(foreground, background);
  const needsImprovement = originalRatio < targetRatio;
  
  const suggestions = [];
  
  if (needsImprovement) {
    // This is a simplified suggestion system
    // In practice, you'd implement proper color manipulation
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);
    
    if (fgRgb && bgRgb) {
      // Suggest lightening foreground if it's dark
      if (getLuminance(fgRgb) < 0.5) {
        suggestions.push({
          type: 'lighten' as const,
          color: 'Consider using a lighter shade (navy-100 or navy-50)',
          newRatio: 0 // Placeholder - would calculate actual values
        });
      }
      
      // Suggest darkening background if it's light
      if (getLuminance(bgRgb) > 0.5) {
        suggestions.push({
          type: 'darken' as const, 
          color: 'Consider using a darker background (navy-800 or navy-900)',
          newRatio: 0 // Placeholder - would calculate actual values
        });
      }
    }
  }
  
  return {
    originalRatio,
    needsImprovement,
    suggestions
  };
}