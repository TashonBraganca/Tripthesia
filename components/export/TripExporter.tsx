"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  Calendar,
  Smartphone,
  Share2,
  Mail,
  Cloud,
  Image,
  Map,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Globe,
  Printer,
  BookOpen,
  Zap,
  Crown,
  Lock,
  ExternalLink
} from 'lucide-react';

interface TripExporterProps {
  tripId: string;
  tripData: TripData;
  userTier: 'free' | 'starter' | 'pro';
  onExport?: (format: ExportFormatId, options: ExportOptions) => Promise<void>;
  className?: string;
}

interface TripData {
  id: string;
  title: string;
  destination: string;
  duration: number;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  itinerary: DayItinerary[];
  accommodations: Accommodation[];
  transportation: Transportation[];
  activities: Activity[];
}

interface DayItinerary {
  day: number;
  date: string;
  activities: Activity[];
  accommodation: Accommodation;
  transportation: Transportation[];
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  duration: number;
  location: string;
  cost: number;
  category: string;
}

interface Accommodation {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  cost: number;
}

interface Transportation {
  type: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  cost: number;
}

type ExportFormatId = 
  | 'pdf-basic'
  | 'pdf-detailed' 
  | 'pdf-visual'
  | 'calendar-google'
  | 'calendar-outlook'
  | 'calendar-ics'
  | 'mobile-app'
  | 'email'
  | 'json-api'
  | 'website-embed'
  | 'print-friendly';

interface ExportOptions {
  includeMap: boolean;
  includePhotos: boolean;
  includeWeather: boolean;
  includeBudget: boolean;
  includeNotes: boolean;
  includeContacts: boolean;
  theme: 'modern' | 'classic' | 'minimal';
  language: 'en' | 'es' | 'fr' | 'de';
}

interface ExportFormatType {
  id: ExportFormatId;
  name: string;
  description: string;
  icon: any;
  tierRequired: 'free' | 'starter' | 'pro';
  features: string[];
  fileSize?: string;
  estimatedTime?: string;
  popular?: boolean;
}

const exportFormats: ExportFormatType[] = [
  {
    id: 'pdf-basic',
    name: 'Basic PDF',
    description: 'Simple PDF with essential trip information',
    icon: FileText,
    tierRequired: 'free',
    features: ['Itinerary overview', 'Basic layout', 'Contact info'],
    fileSize: '~1MB',
    estimatedTime: '5 seconds',
  },
  {
    id: 'pdf-detailed',
    name: 'Detailed PDF',
    description: 'Comprehensive PDF with maps, photos, and detailed information',
    icon: BookOpen,
    tierRequired: 'starter',
    features: ['Detailed itinerary', 'Maps integration', 'Weather info', 'Budget breakdown'],
    fileSize: '~5MB',
    estimatedTime: '15 seconds',
    popular: true,
  },
  {
    id: 'pdf-visual',
    name: 'Visual PDF',
    description: 'Premium PDF with custom design and high-quality visuals',
    icon: Image,
    tierRequired: 'pro',
    features: ['Custom design', 'High-res photos', 'Interactive maps', 'Professional layout'],
    fileSize: '~10MB',
    estimatedTime: '30 seconds',
  },
  {
    id: 'calendar-google',
    name: 'Google Calendar',
    description: 'Add all activities to your Google Calendar',
    icon: Calendar,
    tierRequired: 'starter',
    features: ['Auto-sync events', 'Reminders', 'Location links', 'Time zone support'],
    estimatedTime: 'Instant',
  },
  {
    id: 'calendar-outlook',
    name: 'Outlook Calendar',
    description: 'Export to Microsoft Outlook calendar',
    icon: Calendar,
    tierRequired: 'starter',
    features: ['Outlook integration', 'Meeting invites', 'Recurring events'],
    estimatedTime: 'Instant',
  },
  {
    id: 'mobile-app',
    name: 'Mobile App Sync',
    description: 'Sync trip to Tripthesia mobile app for offline access',
    icon: Smartphone,
    tierRequired: 'pro',
    features: ['Offline access', 'GPS navigation', 'Real-time updates', 'Photo sharing'],
    estimatedTime: 'Instant',
  },
  {
    id: 'email',
    name: 'Email Summary',
    description: 'Send trip details via email to yourself or travel companions',
    icon: Mail,
    tierRequired: 'free',
    features: ['Email delivery', 'Multiple recipients', 'HTML format'],
    estimatedTime: '5 seconds',
  },
  {
    id: 'json-api',
    name: 'API Export',
    description: 'Export trip data in JSON format for developers',
    icon: Cloud,
    tierRequired: 'pro',
    features: ['JSON format', 'API endpoints', 'Webhooks', 'Real-time sync'],
    estimatedTime: 'Instant',
  },
];

export default function TripExporter({
  tripId,
  tripData,
  userTier,
  onExport,
  className = ''
}: TripExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatType | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMap: true,
    includePhotos: true,
    includeWeather: true,
    includeBudget: true,
    includeNotes: true,
    includeContacts: true,
    theme: 'modern',
    language: 'en',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{
    format: ExportFormatType;
    timestamp: string;
    success: boolean;
  }>>([]);

  const canAccessFormat = (format: ExportFormatType) => {
    const tierOrder = { free: 0, starter: 1, pro: 2 };
    return tierOrder[userTier] >= tierOrder[format.tierRequired];
  };

  const handleExport = useCallback(async (format: ExportFormatType) => {
    if (!canAccessFormat(format)) {
      return;
    }

    setIsExporting(true);
    try {
      await onExport?.(format.id, exportOptions);
      setExportHistory(prev => [{
        format,
        timestamp: new Date().toISOString(),
        success: true,
      }, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Export failed:', error);
      setExportHistory(prev => [{
        format,
        timestamp: new Date().toISOString(),
        success: false,
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsExporting(false);
    }
  }, [onExport, exportOptions, userTier]);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return FileText;
      case 'starter': return Zap;
      case 'pro': return Crown;
      default: return FileText;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-gray-600 bg-gray-100';
      case 'starter': return 'text-blue-600 bg-blue-100';
      case 'pro': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Trip</h2>
            <p className="text-sm text-gray-600">Download or share your trip in various formats</p>
          </div>
        </div>

        {/* Trip Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">{tripData.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Map className="h-3 w-3" />
              <span>{tripData.destination}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{tripData.duration} days</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(tripData.startDate)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>${tripData.budget} {tripData.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Formats */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Formats</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {exportFormats.map((format, index) => {
            const IconComponent = format.icon;
            const TierIcon = getTierIcon(format.tierRequired);
            const canAccess = canAccessFormat(format);
            
            return (
              <motion.div
                key={format.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  canAccess
                    ? 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                } ${selectedFormat?.id === format.id ? 'border-purple-500 shadow-md' : ''}`}
                onClick={() => canAccess && setSelectedFormat(format)}
              >
                {format.popular && (
                  <div className="absolute -top-2 left-4">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${canAccess ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    <IconComponent className={`h-5 w-5 ${canAccess ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTierColor(format.tierRequired)}`}>
                    <TierIcon className="h-3 w-3" />
                    <span className="capitalize">{format.tierRequired}</span>
                  </div>
                </div>

                <h4 className={`font-medium mb-1 ${canAccess ? 'text-gray-900' : 'text-gray-500'}`}>
                  {format.name}
                </h4>
                <p className={`text-sm mb-3 ${canAccess ? 'text-gray-600' : 'text-gray-400'}`}>
                  {format.description}
                </p>

                <ul className="space-y-1 mb-3">
                  {format.features.slice(0, 3).map((feature, featureIndex) => (
                    <li key={featureIndex} className={`text-xs flex items-center space-x-1 ${canAccess ? 'text-gray-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`h-3 w-3 ${canAccess ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className={`flex items-center justify-between text-xs ${canAccess ? 'text-gray-500' : 'text-gray-400'}`}>
                  {format.fileSize && <span>{format.fileSize}</span>}
                  {format.estimatedTime && <span>{format.estimatedTime}</span>}
                </div>

                {!canAccess && (
                  <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-medium">
                        Upgrade to {format.tierRequired}
                      </p>
                    </div>
                  </div>
                )}

                {canAccess && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(format);
                    }}
                    disabled={isExporting}
                    className="w-full mt-3 bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {isExporting ? 'Exporting...' : 'Export'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Export Options */}
        {selectedFormat && canAccessFormat(selectedFormat) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-purple-50 rounded-lg p-4 mb-6"
          >
            <h4 className="font-medium text-purple-900 mb-3">
              Export Options for {selectedFormat.name}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedFormat.tierRequired !== 'free' && (
                <>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMap}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeMap: e.target.checked }))}
                      className="text-purple-600"
                    />
                    <span className="text-sm text-purple-800">Include Maps</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includePhotos}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includePhotos: e.target.checked }))}
                      className="text-purple-600"
                    />
                    <span className="text-sm text-purple-800">Include Photos</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeWeather}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeWeather: e.target.checked }))}
                      className="text-purple-600"
                    />
                    <span className="text-sm text-purple-800">Weather Info</span>
                  </label>
                </>
              )}
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeBudget}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeBudget: e.target.checked }))}
                  className="text-purple-600"
                />
                <span className="text-sm text-purple-800">Budget Details</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeNotes}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeNotes: e.target.checked }))}
                  className="text-purple-600"
                />
                <span className="text-sm text-purple-800">Personal Notes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeContacts}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeContacts: e.target.checked }))}
                  className="text-purple-600"
                />
                <span className="text-sm text-purple-800">Contact Info</span>
              </label>
            </div>

            {selectedFormat.tierRequired === 'pro' && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="theme-select" className="block text-sm font-medium text-purple-800 mb-1">
                      Theme
                    </label>
                    <select
                      id="theme-select"
                      value={exportOptions.theme}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="language-select" className="block text-sm font-medium text-purple-800 mb-1">
                      Language
                    </label>
                    <select
                      id="language-select"
                      value={exportOptions.language}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Exports</h4>
            <div className="space-y-2">
              {exportHistory.map((export_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <export_.format.icon className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {export_.format.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(export_.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {export_.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <button className="text-xs text-purple-600 hover:text-purple-700">
                      {export_.success ? 'Download Again' : 'Retry'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {userTier === 'free' && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Unlock Premium Export Features</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Upgrade to Starter or Pro for advanced export options including detailed PDFs, 
                  calendar integration, and mobile app sync.
                </p>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                    Upgrade to Starter
                  </button>
                  <button className="px-3 py-1 border border-blue-300 text-blue-700 rounded text-sm font-medium hover:bg-blue-100">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}