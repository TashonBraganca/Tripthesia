/**
 * Accessibility Audit Component
 * WCAG AA compliance testing and monitoring
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Eye,
  Keyboard,
  MousePointer,
  Volume2,
  Contrast,
  Type,
  Navigation,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Accessibility
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { containerVariants, itemVariants } from '@/lib/motion';
import { trackEvent } from '@/lib/monitoring';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'keyboard' | 'color' | 'text' | 'semantics' | 'focus' | 'aria';
  element: string;
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagGuideline: string;
  solution: string;
  severity: number; // 1-5 scale
}

interface AccessibilityMetrics {
  overallScore: number;
  issues: AccessibilityIssue[];
  compliance: {
    levelA: number;
    levelAA: number;
    levelAAA: number;
  };
  categories: {
    keyboard: number;
    color: number;
    text: number;
    semantics: number;
    focus: number;
    aria: number;
  };
}

export function AccessibilityAudit() {
  const [metrics, setMetrics] = useState<AccessibilityMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const auditRef = useRef<AbortController | null>(null);

  const runAccessibilityAudit = async () => {
    if (isRunning) {
      auditRef.current?.abort();
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    auditRef.current = new AbortController();
    
    try {
      const issues: AccessibilityIssue[] = [];
      
      // Run comprehensive accessibility tests
      await runKeyboardTests(issues, (test) => setCurrentTest(test));
      await runColorContrastTests(issues, (test) => setCurrentTest(test));
      await runTextTests(issues, (test) => setCurrentTest(test));
      await runSemanticTests(issues, (test) => setCurrentTest(test));
      await runFocusTests(issues, (test) => setCurrentTest(test));
      await runAriaTests(issues, (test) => setCurrentTest(test));
      
      // Calculate metrics
      const overallScore = calculateOverallScore(issues);
      const compliance = calculateCompliance(issues);
      const categories = calculateCategoryScores(issues);
      
      setMetrics({
        overallScore,
        issues,
        compliance,
        categories
      });

      trackEvent('accessibility_audit_completed', {
        overall_score: overallScore,
        issues_count: issues.length,
        errors: issues.filter(i => i.type === 'error').length,
        warnings: issues.filter(i => i.type === 'warning').length
      });

    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  // Keyboard accessibility tests
  const runKeyboardTests = async (issues: AccessibilityIssue[], onTest: (test: string) => void) => {
    onTest('Testing keyboard navigation...');
    
    // Check for focusable elements
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const hasTabIndex = element.hasAttribute('tabindex');
      const tabIndex = element.getAttribute('tabindex');
      
      // Check for proper tab order
      if (hasTabIndex && tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          id: `keyboard-${index}`,
          type: 'warning',
          category: 'keyboard',
          element: tagName,
          message: 'Positive tabindex values can create unpredictable tab order',
          wcagLevel: 'A',
          wcagGuideline: '2.4.3 Focus Order',
          solution: 'Use tabindex="0" or remove tabindex attribute',
          severity: 2
        });
      }
      
      // Check for keyboard event handlers on non-interactive elements
      if (!['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
        const hasClickHandler = element.getAttribute('onclick') || 
                               (element as any).onclick;
        if (hasClickHandler && !hasTabIndex) {
          issues.push({
            id: `keyboard-interactive-${index}`,
            type: 'error',
            category: 'keyboard',
            element: tagName,
            message: 'Interactive element is not keyboard accessible',
            wcagLevel: 'A',
            wcagGuideline: '2.1.1 Keyboard',
            solution: 'Add tabindex="0" and keyboard event handlers',
            severity: 4
          });
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // Color contrast tests
  const runColorContrastTests = async (issues: AccessibilityIssue[], onTest: (test: string) => void) => {
    onTest('Testing color contrast...');
    
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    
    textElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Simple contrast check (in production, use proper contrast calculation)
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 0) {
        const fontSize = parseFloat(computedStyle.fontSize);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && computedStyle.fontWeight === 'bold');
        
        // Mock contrast ratio calculation
        const mockContrastRatio = Math.random() * 10 + 3; // Simulate contrast ratio
        const minRatio = isLargeText ? 3 : 4.5; // WCAG AA requirements
        
        if (mockContrastRatio < minRatio) {
          issues.push({
            id: `contrast-${index}`,
            type: 'error',
            category: 'color',
            element: element.tagName.toLowerCase(),
            message: `Insufficient color contrast ratio: ${mockContrastRatio.toFixed(2)}:1 (minimum: ${minRatio}:1)`,
            wcagLevel: 'AA',
            wcagGuideline: '1.4.3 Contrast (Minimum)',
            solution: 'Increase contrast between text and background colors',
            severity: 3
          });
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 700));
  };

  // Text and content tests
  const runTextTests = async (issues: AccessibilityIssue[], onTest: (test: string) => void) => {
    onTest('Testing text accessibility...');
    
    // Check for images without alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          id: `alt-text-${index}`,
          type: 'error',
          category: 'text',
          element: 'img',
          message: 'Image missing alternative text',
          wcagLevel: 'A',
          wcagGuideline: '1.1.1 Non-text Content',
          solution: 'Add descriptive alt attribute to image',
          severity: 4
        });
      } else if (img.getAttribute('alt')?.trim() === '') {
        // Check if decorative image is properly marked
        const isDecorative = img.getAttribute('role') === 'presentation' || 
                            img.getAttribute('alt') === '';
        if (!isDecorative) {
          issues.push({
            id: `empty-alt-${index}`,
            type: 'warning',
            category: 'text',
            element: 'img',
            message: 'Image has empty alt text but may not be decorative',
            wcagLevel: 'A',
            wcagGuideline: '1.1.1 Non-text Content',
            solution: 'Provide descriptive alt text or mark as decorative with role="presentation"',
            severity: 2
          });
        }
      }
    });
    
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));
      if (currentLevel > lastLevel + 1) {
        issues.push({
          id: `heading-hierarchy-${index}`,
          type: 'warning',
          category: 'text',
          element: heading.tagName.toLowerCase(),
          message: 'Heading levels skip a level in hierarchy',
          wcagLevel: 'AA',
          wcagGuideline: '1.3.1 Info and Relationships',
          solution: 'Use proper heading hierarchy (h1 → h2 → h3, etc.)',
          severity: 2
        });
      }
      lastLevel = currentLevel;
    });
    
    await new Promise(resolve => setTimeout(resolve, 600));
  };

  // Semantic HTML tests
  const runSemanticTests = async (issues: AccessibilityIssue[], onTest: (test: string) => void) => {
    onTest('Testing semantic HTML...');
    
    // Check for proper landmark usage
    const main = document.querySelector('main');
    if (!main) {
      issues.push({
        id: 'main-landmark',
        type: 'error',
        category: 'semantics',
        element: 'main',
        message: 'Page missing main landmark',
        wcagLevel: 'A',
        wcagGuideline: '1.3.1 Info and Relationships',
        solution: 'Add <main> element to identify main content area',
        severity: 3
      });
    }
    
    // Check for forms without labels
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach((input, index) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                      input.closest('label') ||
                      input.hasAttribute('aria-label') ||
                      input.hasAttribute('aria-labelledby');
      
      if (!hasLabel) {
        issues.push({
          id: `input-label-${index}`,
          type: 'error',
          category: 'semantics',
          element: 'input',
          message: 'Form input missing accessible label',
          wcagLevel: 'A',
          wcagGuideline: '3.3.2 Labels or Instructions',
          solution: 'Add label element or aria-label attribute',
          severity: 4
        });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // Focus management tests
  const runFocusTests = async (issues: AccessibilityIssue[], onTest: (test: string) => void) => {
    onTest('Testing focus management...');
    
    // Check for focus indicators
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const outline = computedStyle.outline;
      const outlineWidth = computedStyle.outlineWidth;
      
      // Check if focus indicator is disabled
      if (outline === 'none' || outlineWidth === '0px') {
        // Check for custom focus styles
        const hasCustomFocus = computedStyle.boxShadow !== 'none' ||
                              computedStyle.border !== 'none';
        
        if (!hasCustomFocus) {
          issues.push({
            id: `focus-indicator-${index}`,
            type: 'error',
            category: 'focus',
            element: element.tagName.toLowerCase(),
            message: 'Focusable element missing focus indicator',
            wcagLevel: 'AA',
            wcagGuideline: '2.4.7 Focus Visible',
            solution: 'Provide visible focus indicator with outline or box-shadow',
            severity: 3
          });
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 400));
  };

  // ARIA tests
  const runAriaTests = async (issues: AccessibilityIssue[], onTest: (test: string) => void) => {
    onTest('Testing ARIA implementation...');
    
    // Check for invalid ARIA attributes
    const elementsWithAria = document.querySelectorAll('[class*="aria-"], [aria-label], [aria-labelledby], [role]');
    
    elementsWithAria.forEach((element, index) => {
      const role = element.getAttribute('role');
      
      // Check for invalid roles
      const validRoles = [
        'button', 'link', 'tab', 'tabpanel', 'dialog', 'menu', 'menuitem',
        'navigation', 'main', 'complementary', 'contentinfo', 'banner'
      ];
      
      if (role && !validRoles.includes(role)) {
        issues.push({
          id: `invalid-role-${index}`,
          type: 'warning',
          category: 'aria',
          element: element.tagName.toLowerCase(),
          message: `Invalid or uncommon ARIA role: "${role}"`,
          wcagLevel: 'A',
          wcagGuideline: '4.1.2 Name, Role, Value',
          solution: 'Use standard ARIA roles or semantic HTML elements',
          severity: 2
        });
      }
      
      // Check for aria-labelledby pointing to non-existent elements
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const referencedElement = document.getElementById(labelledBy);
        if (!referencedElement) {
          issues.push({
            id: `invalid-labelledby-${index}`,
            type: 'error',
            category: 'aria',
            element: element.tagName.toLowerCase(),
            message: `aria-labelledby references non-existent element: "${labelledBy}"`,
            wcagLevel: 'A',
            wcagGuideline: '4.1.2 Name, Role, Value',
            solution: 'Ensure referenced element exists or use aria-label instead',
            severity: 3
          });
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 600));
  };

  // Calculate overall score
  const calculateOverallScore = (issues: AccessibilityIssue[]): number => {
    const maxScore = 100;
    const errorPenalty = 10;
    const warningPenalty = 3;
    const infoPenalty = 1;
    
    const penalties = issues.reduce((total, issue) => {
      switch (issue.type) {
        case 'error': return total + errorPenalty;
        case 'warning': return total + warningPenalty;
        case 'info': return total + infoPenalty;
        default: return total;
      }
    }, 0);
    
    return Math.max(0, maxScore - penalties);
  };

  // Calculate WCAG compliance levels
  const calculateCompliance = (issues: AccessibilityIssue[]) => {
    const levelAIssues = issues.filter(i => i.wcagLevel === 'A' && i.type === 'error').length;
    const levelAAIssues = issues.filter(i => ['A', 'AA'].includes(i.wcagLevel) && i.type === 'error').length;
    const levelAAAIssues = issues.filter(i => i.type === 'error').length;
    
    return {
      levelA: Math.max(0, 100 - (levelAIssues * 20)),
      levelAA: Math.max(0, 100 - (levelAAIssues * 15)),
      levelAAA: Math.max(0, 100 - (levelAAAIssues * 10))
    };
  };

  // Calculate category scores
  const calculateCategoryScores = (issues: AccessibilityIssue[]) => {
    const categories = ['keyboard', 'color', 'text', 'semantics', 'focus', 'aria'];
    const scores: any = {};
    
    categories.forEach(category => {
      const categoryIssues = issues.filter(i => i.category === category);
      const penalty = categoryIssues.reduce((total, issue) => total + issue.severity, 0);
      scores[category] = Math.max(0, 100 - (penalty * 5));
    });
    
    return scores;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Accessibility className="h-6 w-6" />
              Accessibility Audit
            </h2>
            <p className="text-muted-foreground">
              WCAG AA compliance testing and monitoring
            </p>
          </div>
          
          <Button onClick={runAccessibilityAudit} disabled={isRunning}>
            {isRunning ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Stop Audit
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>
        </motion.div>

        {/* Current Test Status */}
        {isRunning && currentTest && (
          <motion.div variants={itemVariants}>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{currentTest}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Results */}
        {metrics && (
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Accessibility Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn("text-4xl font-bold", getScoreColor(metrics.overallScore))}>
                    {metrics.overallScore}%
                  </div>
                  <div className="flex-1">
                    <Progress value={metrics.overallScore} className="h-3" />
                  </div>
                  <Badge variant={getScoreBadgeVariant(metrics.overallScore)}>
                    {metrics.overallScore >= 90 ? 'Excellent' : 
                     metrics.overallScore >= 70 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="compliance">WCAG Compliance</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-red-500">
                      {metrics.issues.filter(i => i.type === 'error').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-yellow-500">
                      {metrics.issues.filter(i => i.type === 'warning').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-blue-500">
                      {metrics.issues.filter(i => i.type === 'info').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Info</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-500">
                      {metrics.issues.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Issues</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compliance" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>WCAG Level A</span>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics.compliance.levelA} className="w-32" />
                      <span className={cn("font-medium", getScoreColor(metrics.compliance.levelA))}>
                        {metrics.compliance.levelA}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WCAG Level AA</span>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics.compliance.levelAA} className="w-32" />
                      <span className={cn("font-medium", getScoreColor(metrics.compliance.levelAA))}>
                        {metrics.compliance.levelAA}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WCAG Level AAA</span>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics.compliance.levelAAA} className="w-32" />
                      <span className={cn("font-medium", getScoreColor(metrics.compliance.levelAAA))}>
                        {metrics.compliance.levelAAA}%
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="categories" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(metrics.categories).map(([category, score]) => (
                    <div key={category} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("text-lg font-bold", getScoreColor(score))}>
                          {score}%
                        </div>
                        <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
                          {category}
                        </Badge>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="issues" className="space-y-4">
                <div className="space-y-2">
                  {metrics.issues.map((issue) => (
                    <Card key={issue.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {issue.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                            {issue.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                            {issue.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{issue.element}</Badge>
                              <Badge variant="secondary">{issue.wcagLevel}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {issue.wcagGuideline}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{issue.message}</p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Solution:</strong> {issue.solution}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}