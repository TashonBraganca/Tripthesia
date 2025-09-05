// Accessibility Tester Component - Phase 8 Accessibility Excellence
// Development-only component for real-time accessibility testing with axe-core

'use client';

import { useEffect, useRef } from 'react';

interface AccessibilityTesterProps {
  enabled?: boolean;
  logViolations?: boolean;
  showWidget?: boolean;
}

export function AccessibilityTester({ 
  enabled = process.env.NODE_ENV === 'development',
  logViolations = true,
  showWidget = true 
}: AccessibilityTesterProps) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!enabled || hasInitialized.current) return;
    hasInitialized.current = true;

    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const initAxe = async () => {
      try {
        const React = await import('react');
        const ReactDOM = await import('react-dom');
        const axe = await import('@axe-core/react');
        
        axe.default(React, ReactDOM, 1000);
        
        if (logViolations) {
          console.log('🔍 Accessibility testing enabled with axe-core');
        }
      } catch (error) {
        console.warn('Failed to initialize accessibility testing:', error);
      }
    };

    // Delay initialization to allow React to mount
    const timer = setTimeout(initAxe, 1000);
    return () => clearTimeout(timer);
  }, [enabled, logViolations]);

  // Show accessibility widget in development
  if (enabled && showWidget && process.env.NODE_ENV === 'development') {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50"
        role="complementary"
        aria-label="Accessibility testing widget"
      >
        <details className="bg-navy-900 border border-navy-600 rounded-lg p-3 shadow-lg">
          <summary className="text-teal-400 text-sm font-medium cursor-pointer">
            🔍 A11y Testing
          </summary>
          
          <div className="mt-2 space-y-2 text-xs text-navy-200">
            <div>✅ axe-core: Active</div>
            <div>🎯 WCAG 2.1 AA</div>
            <div>📊 Check console for violations</div>
            
            <button
              onClick={() => runManualTest()}
              className="w-full mt-2 px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs rounded transition-colors"
            >
              Run Manual Test
            </button>
          </div>
        </details>
      </div>
    );
  }

  return null;
}

// Manual accessibility test function
async function runManualTest() {
  if (typeof window === 'undefined') return;

  try {
    const axeCore = await import('axe-core');
    const results = await axeCore.default.run();
    
    console.group('🔍 Manual Accessibility Test Results');
    console.log('Total violations found:', results.violations.length);
    
    if (results.violations.length > 0) {
      console.group('❌ Violations');
      results.violations.forEach((violation, index) => {
        console.group(`${index + 1}. ${violation.id} (${violation.impact})`);
        console.log('Description:', violation.description);
        console.log('Help:', violation.help);
        console.log('Help URL:', violation.helpUrl);
        console.log('Elements:', violation.nodes.length);
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`  ${nodeIndex + 1}. ${node.html}`);
          if (node.failureSummary) {
            console.log(`     Issue: ${node.failureSummary}`);
          }
        });
        console.groupEnd();
      });
      console.groupEnd();
    } else {
      console.log('✅ No violations found!');
    }

    if (results.passes.length > 0) {
      console.group('✅ Passes');
      console.log(`${results.passes.length} rules passed`);
      console.groupEnd();
    }

    console.groupEnd();
    
    // Show results in UI as well
    if (results.violations.length > 0) {
      const summaryMessage = `Found ${results.violations.length} accessibility violations. Check console for details.`;
      
      // Create temporary notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 400px;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      `;
      notification.textContent = summaryMessage;
      notification.setAttribute('role', 'alert');
      notification.setAttribute('aria-live', 'assertive');
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 5000);
    } else {
      // Success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 400px;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      `;
      notification.textContent = '✅ No accessibility violations found!';
      notification.setAttribute('role', 'status');
      notification.setAttribute('aria-live', 'polite');
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
    
  } catch (error) {
    console.error('Failed to run accessibility test:', error);
  }
}

// Export manual test function for external use
export { runManualTest };