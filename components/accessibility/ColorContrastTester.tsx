// Color Contrast Tester Component - Phase 8 Accessibility Excellence
// Development tool for WCAG 2.1 AA compliance verification

'use client';

import React, { useState, useEffect } from 'react';
import { auditColorContrast, checkWCAGCompliance, getContrastRatio, TripthesiaColors } from '@/lib/accessibility/color-contrast';
import { CheckCircle, XCircle, AlertTriangle, Eye, Palette } from 'lucide-react';

interface ColorContrastTesterProps {
  enabled?: boolean;
}

export function ColorContrastTester({ enabled = process.env.NODE_ENV === 'development' }: ColorContrastTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [auditResults, setAuditResults] = useState<ReturnType<typeof auditColorContrast> | null>(null);
  const [customForeground, setCustomForeground] = useState('#FFFFFF');
  const [customBackground, setCustomBackground] = useState('#061A2C');

  useEffect(() => {
    if (isOpen && !auditResults) {
      setAuditResults(auditColorContrast());
    }
  }, [isOpen, auditResults]);

  const customContrastResult = checkWCAGCompliance(customForeground, customBackground);

  if (!enabled) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-20 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Toggle color contrast tester"
        title="Color Contrast Tester"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Color Contrast Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-auto bg-black/50 backdrop-blur-sm">
          <div className="flex items-start justify-center min-h-screen p-4">
            <div className="bg-navy-900/95 backdrop-blur-md border border-navy-400/30 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-navy-400/30">
                <div>
                  <h2 className="text-xl font-semibold text-navy-50 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-teal-400" />
                    Color Contrast Audit
                  </h2>
                  <p className="text-navy-300 text-sm mt-1">WCAG 2.1 AA Compliance Testing</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-navy-400 hover:text-navy-200 transition-colors"
                  aria-label="Close color contrast tester"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary */}
                {auditResults && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-teal-300">{auditResults.passed}</div>
                      <div className="text-teal-200 text-sm">Passed</div>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-300">{auditResults.failed}</div>
                      <div className="text-red-200 text-sm">Failed</div>
                    </div>
                    <div className="bg-navy-800/50 border border-navy-400/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-navy-200">{auditResults.total}</div>
                      <div className="text-navy-300 text-sm">Total Tests</div>
                    </div>
                  </div>
                )}

                {/* Custom Color Tester */}
                <div className="bg-navy-800/30 border border-navy-400/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-navy-100 mb-4">Custom Color Test</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-200 mb-2">
                        Foreground Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customForeground}
                          onChange={(e) => setCustomForeground(e.target.value)}
                          className="w-12 h-10 rounded border border-navy-400/30"
                        />
                        <input
                          type="text"
                          value={customForeground}
                          onChange={(e) => setCustomForeground(e.target.value)}
                          className="flex-1 px-3 py-2 bg-navy-700 border border-navy-400/30 rounded text-navy-100 text-sm"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-200 mb-2">
                        Background Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customBackground}
                          onChange={(e) => setCustomBackground(e.target.value)}
                          className="w-12 h-10 rounded border border-navy-400/30"
                        />
                        <input
                          type="text"
                          value={customBackground}
                          onChange={(e) => setCustomBackground(e.target.value)}
                          className="flex-1 px-3 py-2 bg-navy-700 border border-navy-400/30 rounded text-navy-100 text-sm"
                          placeholder="#061A2C"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-navy-400/30">
                    <div
                      className="p-4 rounded text-center"
                      style={{ 
                        backgroundColor: customBackground,
                        color: customForeground
                      }}
                    >
                      <h4 className="text-lg font-semibold mb-2">Sample Text Preview</h4>
                      <p className="text-sm mb-2">
                        This is normal sized text. Contrast ratio: {customContrastResult.ratio.toFixed(2)}:1
                      </p>
                      <p className="text-xs">
                        This is small text to test minimum requirements.
                      </p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {customContrastResult.wcagAA ? (
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-navy-200">
                        WCAG AA Normal Text (4.5:1 minimum)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customContrastResult.wcagAALarge ? (
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-navy-200">
                        WCAG AA Large Text (3:1 minimum)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Results */}
                {auditResults && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-navy-100">Tripthesia Color Audit Results</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {auditResults.results.map((result, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            result.status === 'pass'
                              ? 'bg-teal-900/20 border-teal-500/30'
                              : result.status === 'warning'
                              ? 'bg-amber-900/20 border-amber-500/30'
                              : 'bg-red-900/20 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {result.status === 'pass' ? (
                                  <CheckCircle className="w-4 h-4 text-teal-400" />
                                ) : result.status === 'warning' ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <h4 className="font-medium text-navy-100 text-sm">
                                  {result.name}
                                </h4>
                              </div>
                              <div className="text-xs text-navy-300 space-y-1">
                                <div>Contrast: {result.ratio.toFixed(2)}:1</div>
                                <div className="flex gap-4">
                                  <span>Normal: {result.wcagAA ? '✅' : '❌'}</span>
                                  <span>Large: {result.wcagAALarge ? '✅' : '❌'}</span>
                                </div>
                                {result.recommendations && (
                                  <div className="text-amber-300 text-xs mt-1">
                                    💡 {result.recommendations}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Color Preview */}
                            <div className="ml-4">
                              <div
                                className="w-16 h-8 rounded text-xs flex items-center justify-center font-medium"
                                style={{
                                  backgroundColor: result.background,
                                  color: result.foreground
                                }}
                              >
                                Text
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Palette Reference */}
                <div className="bg-navy-800/30 border border-navy-400/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-navy-100 mb-4">Tripthesia Color Palette</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(TripthesiaColors).map(([colorName, colors]) => {
                      if (typeof colors === 'object') {
                        return (
                          <div key={colorName}>
                            <h4 className="text-sm font-medium text-navy-200 mb-2 capitalize">{colorName}</h4>
                            <div className="space-y-1">
                              {Object.entries(colors).map(([shade, value]) => (
                                <div key={shade} className="flex items-center gap-2 text-xs">
                                  <div
                                    className="w-4 h-4 rounded border border-navy-400/30"
                                    style={{ backgroundColor: value }}
                                  />
                                  <span className="text-navy-300">{shade}</span>
                                  <span className="text-navy-400 font-mono">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}