"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Map, 
  Calendar, 
  Database,
  Navigation,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TripExportService, type TripData, type ExportOptions, type ExportResult } from '@/lib/services/trip-export';

// ==================== TYPES ====================

interface TripExporterProps {
  tripData: TripData;
  className?: string;
  onClose?: () => void;
}

interface ExportFormat {
  id: ExportOptions['format'];
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  mimeType: string;
  features: string[];
  useCase: string;
}

// ==================== COMPONENT ====================

export function TripExporter({ tripData, className = "", onClose }: TripExporterProps) {
  // State management
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('pdf');
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    includeRoute: true,
    includeAccommodations: true,
    includeActivities: true,
    includeDining: true,
    includeNotes: true,
    language: 'en',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Export service
  const exportService = new TripExportService();

  // Available export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Itinerary',
      description: 'Comprehensive printable itinerary with all trip details',
      icon: FileText,
      mimeType: 'application/pdf',
      features: ['Printable', 'Complete Details', 'Professional Layout'],
      useCase: 'Perfect for printing or sharing complete trip information'
    },
    {
      id: 'ics',
      name: 'Calendar Events',
      description: 'Import all trip events into your calendar app',
      icon: Calendar,
      mimeType: 'text/calendar',
      features: ['Calendar Integration', 'Reminders', 'Time Blocking'],
      useCase: 'Ideal for syncing with Google Calendar, Outlook, or Apple Calendar'
    },
    {
      id: 'gpx',
      name: 'GPS Route',
      description: 'GPS-compatible route file for navigation devices',
      icon: Navigation,
      mimeType: 'application/gpx+xml',
      features: ['GPS Compatible', 'Waypoints', 'Route Data'],
      useCase: 'Use with GPS devices, hiking apps, or navigation software'
    },
    {
      id: 'kml',
      name: 'Google Earth Map',
      description: 'Interactive map with all locations and routes',
      icon: Globe,
      mimeType: 'application/vnd.google-earth.kml+xml',
      features: ['Visual Map', 'Google Earth', 'Location Markers'],
      useCase: 'View your trip in Google Earth or Google Maps'
    },
    {
      id: 'json',
      name: 'Data Export',
      description: 'Complete structured trip data for backup or analysis',
      icon: Database,
      mimeType: 'application/json',
      features: ['Complete Data', 'Machine Readable', 'Backup'],
      useCase: 'For developers, data analysis, or complete backup'
    }
  ];

  // ==================== HANDLERS ====================

  const handleExport = async () => {
    if (!selectedFormat) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        ...exportOptions
      };

      const result = await exportService.exportTrip(tripData, options);
      setExportResult(result);

      if (result.success) {
        // Auto-download the file
        TripExportService.downloadFile(result);
      }
    } catch (error) {
      setExportResult({
        success: false,
        filename: '',
        mimeType: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFormatStats = (format: ExportFormat) => {
    let itemCount = 0;
    
    if (exportOptions.includeAccommodations) itemCount += tripData.accommodations.length;
    if (exportOptions.includeActivities) itemCount += tripData.activities.length;
    if (exportOptions.includeDining) itemCount += tripData.dining.length;
    if (exportOptions.includeRoute && tripData.route) itemCount += tripData.route.waypoints.length;
    
    return {
      itemCount,
      estimatedSize: format.id === 'pdf' ? '2-5 MB' : 
                     format.id === 'ics' ? '5-20 KB' :
                     format.id === 'json' ? '50-200 KB' : '10-50 KB'
    };
  };

  // ==================== RENDER ====================

  return (
    <div className={`${className} bg-navy-900/30 backdrop-blur-sm rounded-2xl border border-navy-800/30 overflow-hidden`}>
      {/* Header */}
      <div className="p-6 border-b border-navy-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Download className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-100">Export Trip</h2>
              <p className="text-sm text-navy-300">
                Export your trip in various formats for different uses
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-navy-400 hover:text-navy-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Format Selection */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-navy-100 mb-4">Choose Export Format</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;
            const stats = getFormatStats(format);
            
            return (
              <motion.button
                key={format.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-teal-900/30 border-teal-500/50 shadow-lg shadow-teal-500/20'
                    : 'bg-navy-900/20 border-navy-800/30 hover:bg-navy-800/30 hover:border-navy-700/50'
                }`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-teal-500/20' : 'bg-navy-800/30'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${
                      isSelected ? 'text-teal-100' : 'text-navy-100'
                    }`}>
                      {format.name}
                    </h4>
                    <p className={`text-sm mb-2 ${
                      isSelected ? 'text-teal-300' : 'text-navy-300'
                    }`}>
                      {format.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {format.features.map((feature, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded ${
                        isSelected 
                          ? 'bg-teal-800/30 text-teal-300' 
                          : 'bg-navy-800/50 text-navy-400'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <p className={`text-xs italic ${
                  isSelected ? 'text-teal-400' : 'text-navy-400'
                }`}>
                  {format.useCase}
                </p>

                <div className={`mt-2 text-xs flex justify-between ${
                  isSelected ? 'text-teal-400' : 'text-navy-500'
                }`}>
                  <span>~{stats.estimatedSize}</span>
                  <span>{stats.itemCount} items</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Export Options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-navy-200 hover:text-navy-100 transition-colors mb-4"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Export Options</span>
            {showAdvanced ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-navy-900/20 rounded-xl p-4 border border-navy-800/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Include Options */}
                  <div>
                    <h4 className="font-medium text-navy-100 mb-3">Include in Export</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'includeRoute', label: 'Route & Navigation', count: tripData.route?.waypoints.length || 0 },
                        { key: 'includeAccommodations', label: 'Hotels & Stays', count: tripData.accommodations.length },
                        { key: 'includeActivities', label: 'Activities & Tours', count: tripData.activities.length },
                        { key: 'includeDining', label: 'Restaurants & Dining', count: tripData.dining.length },
                        { key: 'includeNotes', label: 'Notes & Comments', count: tripData.notes ? 1 : 0 }
                      ].map((option) => (
                        <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                            onChange={(e) => handleOptionChange(option.key as keyof ExportOptions, e.target.checked)}
                            className="rounded border-navy-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-navy-200">
                            {option.label}
                            {option.count > 0 && (
                              <span className="text-navy-400 ml-1">({option.count})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Format Options */}
                  <div>
                    <h4 className="font-medium text-navy-100 mb-3">Format Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-navy-300 mb-1">Language</label>
                        <select
                          value={exportOptions.language || 'en'}
                          onChange={(e) => handleOptionChange('language', e.target.value)}
                          className="w-full px-3 py-2 bg-navy-800/50 border border-navy-700/50 rounded-lg text-navy-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-navy-300 mb-1">Currency</label>
                        <select
                          value={exportOptions.currency || 'INR'}
                          onChange={(e) => handleOptionChange('currency', e.target.value)}
                          className="w-full px-3 py-2 bg-navy-800/50 border border-navy-700/50 rounded-lg text-navy-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="INR">Indian Rupee (₹)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                          <option value="GBP">British Pound (£)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-navy-300 mb-1">Date Format</label>
                        <select
                          value={exportOptions.dateFormat || 'DD/MM/YYYY'}
                          onChange={(e) => handleOptionChange('dateFormat', e.target.value)}
                          className="w-full px-3 py-2 bg-navy-800/50 border border-navy-700/50 rounded-lg text-navy-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export Button */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedFormat}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
              isExporting || !selectedFormat
                ? 'bg-navy-700/50 text-navy-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>
                    Export as {exportFormats.find(f => f.id === selectedFormat)?.name || 'File'}
                  </span>
                </>
              )}
            </div>
          </button>

          {/* Export Result */}
          <AnimatePresence>
            {exportResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl border ${
                  exportResult.success
                    ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-900/20 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {exportResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div className="flex-1">
                    {exportResult.success ? (
                      <div>
                        <p className="font-medium">Export Successful!</p>
                        <p className="text-sm opacity-90">
                          {exportResult.filename} ({(exportResult.size / 1024).toFixed(1)} KB) has been downloaded
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Export Failed</p>
                        <p className="text-sm opacity-90">{exportResult.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trip Summary */}
        <div className="mt-6 p-4 bg-navy-900/10 rounded-xl border border-navy-800/20">
          <h4 className="font-medium text-navy-100 mb-3">Trip Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-navy-200">{tripData.dates.duration}</div>
              <div className="text-navy-400">Days</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-navy-200">{tripData.accommodations.length}</div>
              <div className="text-navy-400">Hotels</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-navy-200">{tripData.activities.length}</div>
              <div className="text-navy-400">Activities</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-navy-200">{tripData.transportation.length}</div>
              <div className="text-navy-400">Transport</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}