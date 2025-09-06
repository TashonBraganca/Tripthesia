"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, FileText, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { 
  runAccessibilityTest, 
  testMultipleComponents, 
  generateAccessibilityReport,
  logAccessibilityResults,
  type AccessibilityTestResult 
} from '@/lib/accessibility/axe-testing';

interface AccessibilityDevToolsProps {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const COMMON_COMPONENTS = [
  'nav[role="navigation"]',
  'main[role="main"]', 
  'aside[role="complementary"]',
  '[role="form"]',
  '[role="dialog"]',
  '[role="button"]',
  'form',
  '.accessibility-test-target'
];

export const AccessibilityDevTools: React.FC<AccessibilityDevToolsProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<AccessibilityTestResult | null>(null);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  // Don't render in production unless explicitly enabled
  if (!enabled) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4', 
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const runFullPageTest = async () => {
    setIsTestRunning(true);
    try {
      const results = await runAccessibilityTest(document, { level: 'wcag2aa' });
      setTestResults(results);
      setLastTestTime(new Date());
      logAccessibilityResults(results, 'Full Page Test');
      
      // Store results for debugging
      (window as any).__axeResults = results;
    } catch (error) {
      console.error('Accessibility test failed:', error);
    } finally {
      setIsTestRunning(false);
    }
  };

  const runComponentTests = async () => {
    setIsTestRunning(true);
    try {
      const results = await testMultipleComponents(COMMON_COMPONENTS, { level: 'wcag2aa' });
      console.group('🧪 Component Accessibility Test Results');
      
      let totalScore = 0;
      let componentCount = 0;
      
      Object.entries(results).forEach(([selector, result]) => {
        if (result.score !== undefined) {
          totalScore += result.score;
          componentCount++;
        }
        console.log(`${selector}: ${result.score}% (${result.summary})`);
      });
      
      const averageScore = componentCount > 0 ? Math.round(totalScore / componentCount) : 0;
      console.log(`📊 Average Component Score: ${averageScore}%`);
      console.groupEnd();
      
      // Store results for debugging
      (window as any).__axeComponentResults = results;
    } catch (error) {
      console.error('Component accessibility testing failed:', error);
    } finally {
      setIsTestRunning(false);
    }
  };

  const downloadReport = () => {
    if (!testResults) return;
    
    const report = generateAccessibilityReport(testResults);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 95) return <CheckCircle className="w-4 h-4" />;
    if (score >= 80) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 bg-navy-900/95 backdrop-blur-sm border border-navy-600/50 rounded-lg p-4 w-80 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center">
                <Shield className="w-4 h-4 mr-2 text-teal-400" />
                Accessibility Testing
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-navy-400 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Test Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={runFullPageTest}
                  disabled={isTestRunning}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-navy-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-colors"
                >
                  {isTestRunning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Full Test
                    </>
                  )}
                </button>
                
                <button
                  onClick={runComponentTests}
                  disabled={isTestRunning}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-navy-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Components
                </button>
              </div>

              {/* Test Results */}
              {testResults && (
                <div className="bg-navy-800/50 rounded-lg p-3 border border-navy-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-navy-300">Accessibility Score</span>
                    <div className={`flex items-center space-x-1 ${getScoreColor(testResults.score)}`}>
                      {getScoreIcon(testResults.score)}
                      <span className="font-bold">{testResults.score}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-navy-400 mb-2">
                    <div>✅ Passes: {testResults.passes}</div>
                    <div>❌ Violations: {testResults.violations}</div>
                    <div>⚠️ Incomplete: {testResults.incomplete}</div>
                    <div>🚫 Inaccessible: {testResults.inaccessible}</div>
                  </div>
                  
                  {lastTestTime && (
                    <div className="text-xs text-navy-500">
                      Last test: {lastTestTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}

              {/* Download Report */}
              {testResults && (
                <button
                  onClick={downloadReport}
                  className="w-full bg-navy-700 hover:bg-navy-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Download Report
                </button>
              )}

              {/* Instructions */}
              <div className="text-xs text-navy-400 bg-navy-800/30 rounded p-2">
                <strong>💡 Tips:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Full Test: Tests entire page</li>
                  <li>• Components: Tests common UI elements</li>
                  <li>• Results logged to browser console</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-teal-600 hover:bg-teal-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isTestRunning ? { rotate: 360 } : {}}
        transition={isTestRunning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
      >
        <Shield className="w-5 h-5" />
      </motion.button>

      {/* Quick Results Badge */}
      {testResults && !isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`absolute -top-2 -left-2 ${getScoreColor(testResults.score)} bg-navy-900 rounded-full px-2 py-1 text-xs font-bold border border-navy-600`}
        >
          {testResults.score}%
        </motion.div>
      )}
    </div>
  );
};

export default AccessibilityDevTools;