"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Calendar,
  Loader2,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  tripId: string;
  tripTitle: string;
  className?: string;
  children?: React.ReactNode;
}

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export function ExportDialog({ 
  tripId, 
  tripTitle, 
  className, 
  children 
}: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
  const [format, setFormat] = useState<"pdf" | "ics">("pdf");
  const [options, setOptions] = useState({
    includePricing: true,
    includeMap: false, // Maps in PDF are complex, disabled for now
    includeActivities: true,
    includeNotes: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");

    try {
      const response = await fetch(`/api/trips/${tripId}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Set filename based on format
      const sanitizedTitle = tripTitle.replace(/[^a-zA-Z0-9]/g, '-');
      link.download = `trip-${sanitizedTitle}.${format}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportStatus("success");
      
      // Auto-close dialog after successful export
      setTimeout(() => {
        setIsOpen(false);
        setExportStatus("idle");
      }, 2000);

    } catch (error) {
      console.error("Export error:", error);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  const updateOption = (key: keyof typeof options, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className={cn("flex items-center gap-2", className)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Trip
          </DialogTitle>
          <DialogDescription>
            Download your trip itinerary in PDF or calendar format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat("pdf")}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg transition-all",
                  format === "pdf" 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <FileText className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">PDF</div>
                  <div className="text-xs text-muted-foreground">Detailed itinerary</div>
                </div>
              </button>
              
              <button
                onClick={() => setFormat("ics")}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg transition-all",
                  format === "ics" 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Calendar className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Calendar</div>
                  <div className="text-xs text-muted-foreground">ICS file</div>
                </div>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeActivities"
                  checked={options.includeActivities}
                  onCheckedChange={(checked) => updateOption("includeActivities", checked)}
                />
                <Label htmlFor="includeActivities" className="text-sm">
                  Activities and schedule
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePricing"
                  checked={options.includePricing}
                  onCheckedChange={(checked) => updateOption("includePricing", checked)}
                />
                <Label htmlFor="includePricing" className="text-sm">
                  Pricing information
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNotes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) => updateOption("includeNotes", checked)}
                />
                <Label htmlFor="includeNotes" className="text-sm">
                  Notes and descriptions
                </Label>
              </div>
            </div>
          </div>

          {/* Timezone Selection for Calendar Export */}
          {format === "ics" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Timezone</Label>
              <Select value={options.timezone} onValueChange={(value) => updateOption("timezone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Status */}
          {exportStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Export completed successfully!</span>
            </div>
          )}

          {exportStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <X className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Export failed. Please try again.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}